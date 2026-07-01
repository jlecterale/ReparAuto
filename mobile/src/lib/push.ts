/**
 * Push notifications (FCM via @react-native-firebase/messaging) + local display
 * (expo-notifications). The device token is stored on the user document so a
 * backend can target it.
 *
 * NOTE: actual delivery on new messages requires a small Cloud Function that
 * listens to `notifications` document creates and sends FCM to the user's
 * `fcmTokens`. The reference function is documented in `docs/PUSH-BACKEND.md`.
 * Until it is deployed, in-app notifications (Firestore realtime) work fully and
 * foreground push is rendered locally.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import { db } from './firebase';

// Render notifications while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Background/quit handler. Messages that carry a `notification` block are shown
// automatically by the OS, so there's nothing to render here — but registering
// the handler is required by @react-native-firebase/messaging to avoid the
// Android "No task registered for ...HeadlessTask" warning and to give
// data-only messages somewhere to run. Registered at module scope (this file is
// imported by the root layout) so it's set before the JS bundle finishes
// evaluating, as the SDK requires.
messaging().setBackgroundMessageHandler(async () => {
  // No-op: delivery/display is handled by the OS for notification messages.
});

/** Android channel ID used for both foreground display and FCM delivery. */
const ANDROID_CHANNEL_ID = 'default';

/**
 * On Android 8+ a notification channel is REQUIRED — without one, neither the
 * locally-rendered foreground banner nor FCM background pushes are shown. This
 * was the missing piece: the app requested permission and stored a token but
 * never created a channel, so nothing surfaced on Android. No-op on iOS.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Notificações',
    importance: Notifications.AndroidImportance.HIGH,
    // Omit `sound` so the channel uses the system default notification sound.
    // Passing `'default'` (or any string) makes expo-notifications look for a
    // bundled raw resource with that name and log "Custom sound 'default' not
    // found in native app". Bundle a custom sound via the config plugin's
    // `sounds` array if a custom tone is ever wanted.
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function temPermissao(): Promise<boolean> {
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Requests the OS notification permission (and ensures the Android channel).
 * Safe to call without a signed-in user — used by the first-launch prompt and
 * the settings toggle. Returns whether permission ended up granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    await ensureAndroidChannel();
    return await temPermissao();
  } catch {
    return false;
  }
}

const PERMISSION_ASKED_KEY = 'push_permission_asked_v1';

/**
 * On the very first app launch, proactively ask for notification permission so
 * the user can opt in before any push is ever sent. Prompts only once (tracked
 * in AsyncStorage); the OS itself won't re-show its dialog after the first
 * answer anyway. Best-effort — swallows storage/permission errors.
 */
export async function requestPermissionOnFirstLaunch(): Promise<void> {
  try {
    if (await AsyncStorage.getItem(PERMISSION_ASKED_KEY)) return;
    await AsyncStorage.setItem(PERMISSION_ASKED_KEY, '1');
    await requestNotificationPermission();
  } catch {
    // best-effort
  }
}

/** Requests permission, fetches the FCM token and stores it on the user doc. */
export async function registerForPush(uid: string): Promise<string | null> {
  try {
    await ensureAndroidChannel();
    if (!(await temPermissao())) return null;
    if (Platform.OS === 'ios') {
      await messaging().registerDeviceForRemoteMessages();
    }
    const token = await messaging().getToken();
    if (token) {
      await db
        .collection('users')
        .doc(uid)
        .set({ fcmTokens: firestore.FieldValue.arrayUnion(token) }, { merge: true });
    }
    return token;
  } catch {
    return null;
  }
}

/** Removes this device's token from the user doc (call on logout). */
export async function unregisterPush(uid: string): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (token) {
      await db
        .collection('users')
        .doc(uid)
        .set({ fcmTokens: firestore.FieldValue.arrayRemove(token) }, { merge: true });
    }
  } catch {
    // ignore
  }
}

type RemoteMessage = FirebaseMessagingTypes.RemoteMessage;

/**
 * Wires foreground display + tap handling. `onOpen` receives the message data
 * (e.g. `{ link }`) so the caller can deep-link. Returns an unsubscribe fn.
 */
export function setupPushHandlers(onOpen: (data: RemoteMessage['data']) => void): () => void {
  // Make sure the channel exists even if registerForPush hasn't run yet.
  ensureAndroidChannel().catch(() => {});

  // Foreground messages → show a local banner.
  const unsubForeground = messaging().onMessage(async (msg) => {
    const title = msg.notification?.title ?? 'RecarGarage';
    const body = msg.notification?.body ?? '';
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: msg.data ?? {} },
      // Android: present on the high-importance channel created at register time
      // so the banner actually pops (a bare `{ channelId }` is the "deliver now"
      // trigger). Ignored on iOS, which uses `null`.
      trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
  });

  // App opened from a background notification.
  const unsubOpened = messaging().onNotificationOpenedApp((msg) => onOpen(msg.data));

  // App opened from a quit state.
  messaging()
    .getInitialNotification()
    .then((msg) => msg && onOpen(msg.data))
    .catch(() => {});

  // Tap on a locally-presented (foreground) notification.
  const sub = Notifications.addNotificationResponseReceivedListener((response) =>
    onOpen(response.notification.request.content.data as RemoteMessage['data']),
  );

  return () => {
    unsubForeground();
    unsubOpened();
    sub.remove();
  };
}
