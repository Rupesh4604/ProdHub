import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './env';

// Local testing only: `REACT_APP_USE_EMULATORS=true` points the app at the
// Firebase Auth/Firestore emulators (`firebase emulators:start`), so sign-up,
// data and account-deletion flows can be exercised without touching production.
const USE_EMULATORS = process.env.REACT_APP_USE_EMULATORS === 'true';

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    if (USE_EMULATORS) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db };
export { isFirebaseConfigured } from './env';
