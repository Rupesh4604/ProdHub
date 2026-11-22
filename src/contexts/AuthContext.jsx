import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  linkWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { isFirebaseConfigured } from '../config/env';
import { seedDemoData } from '../services/demoSeed';

const AuthContext = createContext({
  user: null,
  isDemo: false,
  isAuthReady: !isFirebaseConfigured,
  signInWithGoogle: async () => {},
  emailSignIn: async () => {},
  emailSignUp: async () => {},
  signOutUser: async () => {},
  startDemo: async () => {},
  saveDemoWithGoogle: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(!isFirebaseConfigured);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsAuthReady(true);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsDemo(!!currentUser?.isAnonymous);
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Auth not configured');
    
    if (window.chrome && window.chrome.identity) {
      return new Promise((resolve, reject) => {
        window.chrome.identity.getAuthToken({ interactive: true }, async (token) => {
          if (window.chrome.runtime.lastError || !token) {
            return reject(window.chrome.runtime.lastError || new Error('No OAuth token returned.'));
          }
          try {
            const credential = GoogleAuthProvider.credential(null, token);
            await signInWithCredential(auth, credential);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
    } else {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
  };

  const emailSignIn = async (email, password) => {
    if (!auth) throw new Error('Auth not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const emailSignUp = async (email, password) => {
    if (!auth) throw new Error('Auth not configured');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  // Demo mode: an anonymous Firebase user with a seeded sample workspace.
  // Firestore rules key on request.auth.uid, so every feature works unchanged.
  const startDemo = async () => {
    if (!auth) throw new Error('Auth not configured');
    try {
      const cred = await signInAnonymously(auth);
      if (getAdditionalUserInfo(cred)?.isNewUser) {
        await seedDemoData(cred.user.uid);
      }
    } catch (err) {
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/admin-restricted-operation') {
        throw new Error('The demo is not available right now. Please sign up instead.');
      }
      throw err;
    }
  };

  // Turn the anonymous demo account into a real Google account, keeping its data.
  const saveDemoWithGoogle = async () => {
    if (!auth?.currentUser?.isAnonymous) return;
    try {
      const result = await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
      // Linking doesn't fire onAuthStateChanged; refresh so isAnonymous updates.
      await result.user.reload();
      setIsDemo(false);
    } catch (err) {
      if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/email-already-in-use') {
        throw new Error('That Google account already has a ProdHub account. Exit the demo and sign in with it instead.');
      }
      throw err;
    }
  };

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value = useMemo(
    () => ({ user, isDemo, isAuthReady, signInWithGoogle, emailSignIn, emailSignUp, signOutUser, startDemo, saveDemoWithGoogle }),
    [user, isDemo, isAuthReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
