// ============ FIREBASE CENTRALIZADO ============
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

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

// App Check (attestation for the AI Cloud Function proxies — plan 4.1 §2.1).
// Web provider is reCAPTCHA Enterprise; the site key is public by definition
// (NEXT_PUBLIC_*). Without the key this is a graceful no-op — enforcement on
// the backend stays off until >95% of traffic is verified in the console.
const appCheckSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
if (typeof window !== 'undefined' && appCheckSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Attestation must never take the app down.
  }
}

export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);

export let analytics: Analytics | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

export const getAnalyticsInstance = (): Promise<Analytics | null> => {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (analytics) return Promise.resolve(analytics);

  if (!analyticsPromise) {
    analyticsPromise = isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        return analytics;
      }
      return null;
    });
  }
  return analyticsPromise;
};

export default app;
