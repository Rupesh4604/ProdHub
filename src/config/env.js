export const appId = 'my-prod-hub';

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// Preferred (production): a server-side proxy holds the Gemini key so it never
// ships in the client bundle. See gemini-proxy/ for the Cloudflare Worker.
export const GEMINI_PROXY_URL = process.env.REACT_APP_GEMINI_PROXY_URL || '';
// Dev-only fallback: direct calls with a key in .env.local. Never set this in a
// production build — it would expose the key in the bundle.
export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
export const GEMINI_MODEL = 'gemini-2.5-flash';

// AI is usable if either a proxy URL (preferred) or a direct dev key is present.
export const isGeminiConfigured = Boolean(GEMINI_PROXY_URL || GEMINI_API_KEY);

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY'
);
