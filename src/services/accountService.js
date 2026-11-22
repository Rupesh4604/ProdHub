import {
  EmailAuthProvider,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { appId } from '../config/env';
import { db } from '../config/firebase';

// Every collection the app writes under artifacts/{appId}/users/{uid}.
const USER_COLLECTIONS = ['tasks', 'projects', 'goals', 'habits', 'habit_entries', 'meta'];
const BATCH_LIMIT = 450; // Firestore caps a batch at 500 writes.

/** The provider the user signed in with: 'google.com', 'password' or 'anonymous'. */
export const getSignInProvider = (user) => {
  if (!user) return null;
  if (user.isAnonymous) return 'anonymous';
  return user.providerData?.[0]?.providerId || null;
};

/**
 * Firebase only lets a user delete their account shortly after signing in, so
 * confirm their identity first. This runs BEFORE any data is deleted, so a
 * failed re-auth leaves everything intact.
 */
async function reauthenticate(user, password) {
  const provider = getSignInProvider(user);
  if (provider === 'anonymous') return;
  if (provider === 'password') {
    if (!password) throw new Error('Enter your password to confirm.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    return;
  }
  if (provider === 'google.com') {
    // Chrome extension side panel: popups are blocked, use chrome.identity.
    if (window.chrome?.identity?.getAuthToken) {
      const token = await new Promise((resolve, reject) => {
        window.chrome.identity.getAuthToken({ interactive: true }, (t) => {
          if (window.chrome.runtime.lastError || !t) reject(window.chrome.runtime.lastError || new Error('No token'));
          else resolve(t);
        });
      });
      await reauthenticateWithCredential(user, GoogleAuthProvider.credential(null, token));
      return;
    }
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return;
  }
  throw new Error('Unsupported sign-in method.');
}

async function deleteAllUserData(uid) {
  const base = `artifacts/${appId}/users/${uid}`;
  for (const name of USER_COLLECTIONS) {
    const snap = await getDocs(collection(db, `${base}/${name}`));
    for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + BATCH_LIMIT).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  // Belt and braces for the calendar cache doc.
  const batch = writeBatch(db);
  batch.delete(doc(db, `${base}/meta/calendar`));
  await batch.commit();
}

/**
 * Permanently delete the signed-in user's account and every document they own:
 * tasks, projects (incl. notes), goals, habits, habit history and cached
 * Google Calendar events. Then delete the Firebase Auth user itself.
 */
export async function deleteAccount(user, { password } = {}) {
  if (!user || !db) throw new Error('Not signed in.');
  try {
    await reauthenticate(user, password);
  } catch (err) {
    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      throw new Error('That password is incorrect.');
    }
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      throw new Error('Confirmation was cancelled. Nothing was deleted.');
    }
    if (err.code === 'auth/user-mismatch') {
      throw new Error('Please confirm with the same Google account you signed in with.');
    }
    throw err;
  }
  await deleteAllUserData(user.uid);
  await deleteUser(user);
}
