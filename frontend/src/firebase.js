/**
 * Firebase Configuration — Smart Volunteer Coordination Platform
 *
 * SETUP: Replace the placeholder values below with your actual Firebase
 * project credentials from:
 *   Firebase Console → Project Settings → General → Your apps → SDK setup
 *
 * Services enabled:
 *   - Firebase Authentication (email/password)
 *   - Cloud Firestore (real-time database)
 *   - Firebase Storage (certificates, files)
 *   - Firebase Cloud Messaging (push notifications)
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// ── Replace with your Firebase project config ──────────────────────────
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId:             'YOUR_APP_ID',
  measurementId:     'YOUR_MEASUREMENT_ID',
};
// ───────────────────────────────────────────────────────────────────────

// Detect whether Firebase is configured with real credentials
export const FIREBASE_CONFIGURED =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID';

let app, auth, db, storage, messaging;

if (FIREBASE_CONFIGURED) {
  app      = initializeApp(firebaseConfig);
  auth     = getAuth(app);
  db       = getFirestore(app);
  storage  = getStorage(app);

  // FCM is only available in browsers that support it
  messaging = null;
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
} else {
  // Stub objects so imports never crash in dev mode
  auth = storage = db = messaging = null;
  console.warn(
    '[EcoPulse] Firebase not configured — real-time features disabled.\n' +
    'Edit frontend/src/firebase.js and add your Firebase project credentials.'
  );
}

export { auth, db, storage, messaging };
export default app;
