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
import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import storageModule from '@react-native-firebase/storage';

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

export { firestoreModule, authModule, storageModule };
