import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let initialized = false;

/** Normalize private_key: env vars often store \\n instead of actual newlines (causes Invalid JWT Signature) */
function normalizePrivateKey(cred) {
  if (cred?.private_key && typeof cred.private_key === 'string') {
    cred.private_key = cred.private_key.replace(/\\n/g, '\n');
  }
  return cred;
}

function tryParseKey(key) {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed.length < 10) return null;
  try {
    // Handle multi-line JSON (e.g. from .env copy-paste or Render env)
    const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
    return normalizePrivateKey(JSON.parse(normalized));
  } catch {
    return null;
  }
}

export function initFirebase() {
  if (initialized) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  try {
    // Log server time (JWT requires synced clock; Render uses NTP)
    const now = new Date();
    console.log('[Firebase] Server time:', now.toISOString(), '| drift check:', Math.abs(now - Date.now()) < 1000 ? 'ok' : 'possible skew');

    let cred = tryParseKey(key);
    if (!cred) {
      // dotenv truncates multi-line .env values: load from file instead
      const keyPath = path.join(__dirname, '../../serviceAccountKey.json');
      try {
        const data = fs.readFileSync(keyPath, 'utf8');
        cred = normalizePrivateKey(JSON.parse(data));
      } catch {}
    }
    if (cred) {
      // Sanity check: private_key must have PEM headers (no secrets logged)
      const pk = cred.private_key || '';
      const hasBegin = pk.includes('-----BEGIN');
      const hasEnd = pk.includes('-----END');
      const hasNewlines = pk.includes('\n');
      const keyLen = key ? key.length : 0;
      console.log('[Firebase] Credential check: project_id=', cred.project_id, '| client_email=', cred.client_email?.slice(0, 30) + '...', '| PEM valid=', hasBegin && hasEnd, '| hasNewlines=', hasNewlines, '| env_key_len=', keyLen);
      if (!hasBegin || !hasEnd) {
        console.warn('[Firebase] WARNING: private_key may be malformed (missing PEM headers). Check FIREBASE_SERVICE_ACCOUNT_KEY in Render env.');
      }
      if (keyLen > 0 && keyLen < 1500) {
        console.warn('[Firebase] WARNING: env key length', keyLen, 'seems short (typical ~2500). Key may be truncated.');
      }

      admin.initializeApp({ credential: admin.credential.cert(cred) });
      initialized = true;
      console.log('[Firebase] Admin initialized (token fetch happens on first FCM send)');
    } else if (credPath) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      initialized = true;
      console.log('[Firebase] Admin initialized via applicationDefault');
    } else {
      console.warn('[Firebase] No credential found (FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS)');
    }
  } catch (err) {
    console.warn('[Firebase] Init failed:', err.message);
  }
}

export function getMessaging() {
  return admin.apps.length ? admin.messaging() : null;
}

export function isFirebaseConfigured() {
  return initialized && admin.apps.length > 0;
}
