// ============ FIREBASE CENTRALIZADO ============
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: 'AIzaSyDQC9m8SYHsZbeEG-G-b708JFbtUV9knq8',
  authDomain: 'reparauto-site.firebaseapp.com',
  projectId: 'reparauto-site',
  storageBucket: 'reparauto-site.firebasestorage.app',
  messagingSenderId: '707836120678',
  appId: '1:707836120678:web:4c18eee236e955a75767a7',
  measurementId: 'G-MTSTFD5MJ5',
};

// Inicializar apenas uma vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Inside a native WebView (iOS WKWebView / Android System WebView) Firestore's
// default WebChannel streaming transport fails to establish a connection, so
// `onSnapshot` listeners hang forever without ever firing data OR error — which
// is why listings load on the web but never inside the native app. Long-polling
// is the supported fallback transport for those environments.
const isNativeWebView = Capacitor.isNativePlatform();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ...(isNativeWebView ? { experimentalForceLongPolling: true } : {}),
});
export const storage = getStorage(app);
export default app;
