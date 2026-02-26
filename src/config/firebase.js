import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let initialized = false;

function tryParseKey(key) {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (trimmed.length < 10) return null;
  try {
    // Handle multi-line JSON (e.g. from .env copy-paste or Render env)
    const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\n/g, ' ');
    return JSON.parse(normalized);
  } catch {
    return null;
  }
}

export function initFirebase() {
  if (initialized) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  try {
    let cred = tryParseKey(key);
    if (!cred) {
      // dotenv truncates multi-line .env values: load from file instead
      const keyPath = path.join(__dirname, '../../serviceAccountKey.json');
      try {
        const data = fs.readFileSync(keyPath, 'utf8');
        cred = JSON.parse(data);
      } catch {}
    }
    if (cred) {
      admin.initializeApp({ credential: admin.credential.cert(cred) });
      initialized = true;
      console.log('Firebase Admin initialized');
    } else if (credPath) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      initialized = true;
      console.log('Firebase Admin initialized');
    }
  } catch (err) {
    console.warn('Firebase Admin init failed:', err.message);
  }
}

export function getMessaging() {
  return admin.apps.length ? admin.messaging() : null;
}

export function isFirebaseConfigured() {
  return initialized && admin.apps.length > 0;
}
