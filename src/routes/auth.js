import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { requireAuth, signAuthToken, signPhoneAuthToken } from '../middleware/auth.js';

const router = Router();

// OTP store (use Redis in production)
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 min
const ADMIN_PHONES = (process.env.ADMIN_PHONES || '').split(',').map((p) => p.trim()).filter(Boolean);

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function getRole(phone) {
  const n = String(phone || '').replace(/\s/g, '');
  return ADMIN_PHONES.some((p) => String(p).replace(/\s/g, '') === n) ? 'admin' : 'user';
}

/** Valid FCM token format (basic check) */
function isValidFcmToken(token) {
  return typeof token === 'string' && token.length > 50 && !token.startsWith('dev-');
}

async function sendFcmMessage(fcmToken, otp, phone) {
  if (fcmToken === 'dev-skip') {
    console.log(`[OTP] ${phone} => ${otp} (dev mode - enter manually)`);
    return;
  }
  if (!isValidFcmToken(fcmToken)) {
    console.warn('Invalid FCM token format, falling back to log');
    console.log(`[OTP] ${phone} => ${otp}`);
    return;
  }
  try {
    const { getMessaging } = await import('../config/firebase.js');
    const messaging = getMessaging();
    if (!messaging) {
      console.log(`[OTP] ${phone} => ${otp} (Firebase not configured)`);
      return;
    }
    // Production FCM: data + notification for reliable delivery
    // - Foreground: app receives data via onMessage
    // - Background/quit: user sees notification with OTP, can tap to open
    const message = {
      token: fcmToken,
      data: {
        otp: String(otp),
        phone: String(phone),
        type: 'otp',
      },
      notification: {
        title: 'Your verification code',
        body: `OTP: ${otp}`,
      },
      android: {
        priority: 'high',
        data: { otp: String(otp), phone: String(phone), type: 'otp' },
        directBootOk: true,
        notification: {
          channelId: 'otp',
          title: 'Your verification code',
          body: `OTP: ${otp}`,
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title: 'Your verification code', body: `OTP: ${otp}` },
            contentAvailable: true,
            sound: 'default',
          },
        },
      },
    };
    const msgId = await messaging.send(message);
    console.log(`[FCM] OTP sent to ${phone} (messageId: ${msgId})`);
  } catch (err) {
    const code = err?.code || err?.errorInfo?.code;
    if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
      console.warn('FCM invalid token, OTP logged:', phone);
    } else {
      console.warn('FCM send failed:', err?.message);
    }
    console.log(`[OTP] ${phone} => ${otp}`);
  }
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'strict' : 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const userJson = user.toJSON();
    const token = signAuthToken(userJson);
    setAuthCookie(res, token);
    res.json({ ...userJson, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(204).send();
});

router.post('/request-otp', async (req, res) => {
  try {
    const { phone, fcmToken } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: 'Phone required' });
    }
    const token = fcmToken || 'dev-skip';
    const otp = generateOtp();
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      fcmToken: token,
    });
    await sendFcmMessage(token, otp, phone);
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    console.error('request-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body || {};
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }
    const stored = otpStore.get(phone);
    if (!stored) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(401).json({ error: 'OTP expired' });
    }
    const buf1 = Buffer.from(String(otp), 'utf8');
    const buf2 = Buffer.from(stored.otp, 'utf8');
    if (buf1.length !== buf2.length || !crypto.timingSafeEqual(buf1, buf2)) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }
    otpStore.delete(phone);
    const role = getRole(phone);
    const token = signPhoneAuthToken(phone, role);
    res.json({
      token,
      user: { id: phone, phone, role },
      role,
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    const user = req.user;
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

