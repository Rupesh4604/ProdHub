import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { isFirebaseConfigured } from '../config/env';

const AuthContext = createContext({
  user: null,
  isAuthReady: !isFirebaseConfigured,
  signInWithGoogle: async () => {},
  emailSignIn: async () => {},
  emailSignUp: async () => {},
  signOutUser: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setIsAuthReady(true);
      return undefined;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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

  const signOutUser = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const value = useMemo(
    () => ({ user, isAuthReady, signInWithGoogle, emailSignIn, emailSignUp, signOutUser }),
    [user, isAuthReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
