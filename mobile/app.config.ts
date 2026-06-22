import type { ExpoConfig, ConfigContext } from 'expo/config';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Reference a native Firebase file only when it exists, so building for a single
// platform (e.g. Android only) doesn't warn about the other platform's missing
// credentials file.
const firebaseFile = (name: string): string | undefined => {
  const p = join(__dirname, 'firebase', name);
  return existsSync(p) ? `./firebase/${name}` : undefined;
};

/**
 * RecarGarage mobile app config.
 *
 * Native Firebase credentials are NOT committed. They live in `./firebase/`
 * and are wired into each build through `googleServicesFile` below:
 *   - iOS:     firebase/GoogleService-Info.plist
 *   - Android: firebase/google-services.json
 *
 * See `firebase/README.md` for how to obtain and place these files.
 *
 * The bundle identifier / package name is `com.recargarage` on both platforms.
 */

const BUNDLE_ID = 'com.recargarage';

// Reversed iOS OAuth client id used by Google Sign-In. Read it from the plist
// (key REVERSED_CLIENT_ID) and expose it here, e.g. in `.env`:
//   GOOGLE_IOS_URL_SCHEME=com.googleusercontent.apps.XXXXXXXX-YYYY
const GOOGLE_IOS_URL_SCHEME =
  process.env.GOOGLE_IOS_URL_SCHEME ?? 'com.googleusercontent.apps.REPLACE_ME';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'RecarGarage',
  slug: 'recargarage',
  scheme: 'recargarage',
  version: '1.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#ffffff',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    buildNumber: '1',
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    googleServicesFile: firebaseFile('GoogleService-Info.plist'),
    // Required for Sign in with Apple (App Store Guideline 4.8).
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID,
    versionCode: 2,
    googleServicesFile: firebaseFile('google-services.json'),
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    // Android maps use Google Maps and need an API key. iOS uses Apple Maps
    // (no key). Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env / EAS.
    config: {
      googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '' },
    },
    // No location/media permissions. Notifications (POST_NOTIFICATIONS on
    // Android 13+) are contributed by expo-notifications below. Location
    // (Fase 5) arrives with its feature.
    permissions: [],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    // Installs the shared debug keystore so every machine/CI signs with the
    // same SHA-1 (stable Google Sign-In). See plugins/withDebugKeystore.js.
    './plugins/withDebugKeystore',
    // Release signing from .env creds (RG_UPLOAD_*) — see android:bundle script.
    './plugins/withAndroidReleaseSigning',
    // Listed first so its withAndroidManifest mod runs LAST (manifest mods
    // execute in reverse plugin order) — by then expo-notifications has added
    // the default_notification_color meta-data we need to mark tools:replace.
    './plugins/withFirebaseNotificationFix',
    'expo-router',
    'expo-secure-store',
    'expo-apple-authentication',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-firebase/messaging',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#0b4f9e',
      },
    ],
    [
      'expo-build-properties',
      {
        // React Native Firebase requires static frameworks on iOS.
        ios: { useFrameworks: 'static' },
        android: {},
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: GOOGLE_IOS_URL_SCHEME },
    ],
    [
      'expo-image-picker',
      {
        // Gallery uses the system Photo Picker → no photo-library permission
        // (avoids the Google Play "Photo & Video Permissions" declaration).
        // We never record audio, so block the microphone permission too.
        photosPermission: false,
        microphonePermission: false,
        cameraPermission:
          'A RecarGarage usa a câmara apenas quando tira uma foto para o seu anúncio.',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'A RecarGarage usa a sua localização apenas para mostrar oficinas perto de si no mapa.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      // Fill in after `eas init`.
      projectId: process.env.EAS_PROJECT_ID ?? undefined,
    },
  },
});
