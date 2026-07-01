const { withAndroidManifest } = require('expo/config-plugins');

// Both expo-notifications and @react-native-firebase/messaging declare these
// Firebase "default notification" meta-data entries, which makes the Android
// manifest merger fail with conflicting values (our brand color vs the
// library's @color/white). Marking our entries with tools:replace lets the
// app's values win instead of erroring.
const FIREBASE_META = [
  'com.google.firebase.messaging.default_notification_color',
  'com.google.firebase.messaging.default_notification_icon',
];

/** @param {import('expo/config-plugins').ExportedConfig} config */
module.exports = function withFirebaseNotificationFix(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;
    for (const meta of app['meta-data'] ?? []) {
      if (FIREBASE_META.includes(meta.$['android:name'])) {
        meta.$['tools:replace'] = 'android:resource';
      }
    }
    return cfg;
  });
};
