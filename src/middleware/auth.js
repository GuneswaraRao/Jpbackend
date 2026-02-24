import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signAuthToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function signPhoneAuthToken(phone, role) {
  return jwt.sign(
    { phone, role, type: 'phone' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7);
    }
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type === 'phone') {
      req.user = { id: payload.phone, phone: payload.phone, role: payload.role };
      return next();
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

