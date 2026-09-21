import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
} from 'firebase/firestore';

const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};

export const defaultFirebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyCc-SCv1_5ba20DVoPpnUPRcyn5K4Q095E',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'app-crossfit-c66a5.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'app-crossfit-c66a5',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'app-crossfit-c66a5.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1001267308300',
  appId: env.VITE_FIREBASE_APP_ID || '1:1001267308300:web:9d5a2166a5af8ba7d7cb29',
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    defaultFirebaseConfig.apiKey &&
    defaultFirebaseConfig.projectId &&
    defaultFirebaseConfig.apiKey !== ''
  );
};

export const initFirebase = (): { app: FirebaseApp; db: Firestore } | null => {
  if (db && app) {
    return { app, db };
  }

  try {
    if (!isFirebaseConfigured()) {
      return null;
    }

    app = !getApps().length ? initializeApp(defaultFirebaseConfig) : getApp();

    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
        ignoreUndefinedProperties: true,
      });
    } catch {
      db = getFirestore(app);
    }

    return { app, db };
  } catch (err) {
    console.warn('[Firebase] Error inicializando cliente Firebase:', err);
    return null;
  }
};

export const getFirebaseDb = (): Firestore | null => {
  if (db) return db;
  const initialized = initFirebase();
  return initialized ? initialized.db : null;
};
