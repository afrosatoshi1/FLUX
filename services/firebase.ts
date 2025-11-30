
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Helper to safely access env vars in Vite/Standard environments
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return (window as any).process?.env?.[key] || '';
};

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let app = null;
let auth: any = null;
let firestore: any = null;
let isFirebaseReady = false;

if (!firebaseConfig.apiKey) {
  console.warn("FIREBASE CONFIG MISSING: Running in Offline/Simulated Mode. Add VITE_FIREBASE_API_KEY to enable Cloud sync.");
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
    isFirebaseReady = true;
  } catch (e) {
    console.error("Firebase Initialization Failed:", e);
  }
}

export { auth, firestore, isFirebaseReady };
export default app;
