/**
 * Centralized Firebase access for the mobile app.
 *
 * Unlike the web app (which initializes the JS SDK with an inline config),
 * @react-native-firebase reads its credentials from the native config files
 * bundled at build time:
 *   - iOS:     firebase/GoogleService-Info.plist
 *   - Android: firebase/google-services.json
 * (wired in app.config.ts). So there is no JS config object here — the default
 * app is auto-initialized natively.
 */
import analyticsModule from '@react-native-firebase/analytics';
import authModule from '@react-native-firebase/auth';
import crashlyticsModule from '@react-native-firebase/crashlytics';
import firestoreModule from '@react-native-firebase/firestore';
import storageModule from '@react-native-firebase/storage';

// Analytics must never break app launch (see src/lib/analytics.ts). Unlike the
// other Firebase modules below, its native init previously ran unguarded at
// module load — a throw there (before any UI or error boundary exists) is
// exactly the kind of early crash expo-updates' ON_ERROR_RECOVERY can fail to
// recover from on a fresh install (no cached update to fall back to), which
// then force-aborts the app. Fall back to a no-op so a broken native module
// never takes the whole app down with it.
const noopAnalytics = {
  setUserId: async () => {},
  setUserProperties: async () => {},
  logScreenView: async () => {},
  logLogin: async () => {},
  logSignUp: async () => {},
  logViewItem: async () => {},
  logAddToWishlist: async () => {},
  logEvent: async () => {},
} as ReturnType<typeof analyticsModule>;

export const analytics = (() => {
  try {
    return analyticsModule();
  } catch {
    return noopAnalytics;
  }
})();

// Same reasoning as analytics above: crash reporting must not itself be able
// to crash the app. Collection is off in dev so local errors/hot-reloads
// don't pollute Crashlytics with noise.
const noopCrashlytics = {
  recordError: async () => {},
  setUserId: async () => {},
  setAttributes: async () => {},
  log: () => {},
} as ReturnType<typeof crashlyticsModule>;

export const crashlytics = (() => {
  try {
    const instance = crashlyticsModule();
    instance.setCrashlyticsCollectionEnabled(!__DEV__).catch(() => {});
    return instance;
  } catch {
    return noopCrashlytics;
  }
})();

export const auth = authModule();
export const db = firestoreModule();
export const storage = storageModule();

// Offline persistence is enabled by default on react-native-firebase. Make the
// intent explicit and cap the cache so it mirrors the web `persistentLocalCache`.
db.settings({
  persistence: true,
  cacheSizeBytes: firestoreModule.CACHE_SIZE_UNLIMITED,
  // Drop `undefined` fields on write (cleaner than pruning every payload).
  ignoreUndefinedProperties: true,
}).catch(() => {
  // settings can only be set before the first operation; ignore if already used.
});

export {
  firestoreModule,
  authModule,
  storageModule,
  analyticsModule,
  crashlyticsModule,
};
