import admin from 'firebase-admin';

let initialized = false;

export function initFirebase() {
  if (initialized) return;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  try {
    if (key) {
      const cred = JSON.parse(key);
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
