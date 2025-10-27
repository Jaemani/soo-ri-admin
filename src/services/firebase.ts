// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, limit, query, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Only initialize analytics in the browser and when measurementId is provided
const analytics = (typeof window !== 'undefined' && firebaseConfig.measurementId)
  ? getAnalytics(app)
  : undefined as any;
const auth = getAuth(app);
const db = getFirestore(app);

// Optionally connect to emulator if configured
if (process.env.REACT_APP_FIRESTORE_EMULATOR === 'true') {
  try {
    // Lazy import to avoid bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { connectFirestoreEmulator } = require('firebase/firestore');
    const host = process.env.REACT_APP_FIRESTORE_EMULATOR_HOST || 'localhost';
    const port = Number(process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || 8080);
    connectFirestoreEmulator(db, host, port);
    console.log(`[Firestore] Connected to emulator at ${host}:${port}`);
  } catch (e) {
    console.warn('Failed to connect Firestore emulator:', e);
  }
}

export { app, analytics, auth, db };

// Utility: quick connection test for Firestore
export async function testFirestoreConnection() {
  try {
    const q = query(collection(db, 'users'), limit(1));
    const snap = await getDocs(q);
    return { ok: true, count: snap.size };
  } catch (e: any) {
    console.error('Firestore connection test failed:', e);
    return { ok: false, error: e?.message || String(e) };
  }
}

// Utility: ensure Firebase Auth is signed in (anonymous) so rules with request.auth work
export async function ensureFirebaseAuth() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('[Firebase Auth] Signed in anonymously for Firestore access');
    }
  } catch (e: any) {
    console.warn('Anonymous sign-in failed. Enable Anonymous provider in Firebase Console > Authentication.', e?.message || e);
  }
}
