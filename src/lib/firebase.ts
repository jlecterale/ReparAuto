// ============ FIREBASE CENTRALIZADO ============
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);
export default app;
