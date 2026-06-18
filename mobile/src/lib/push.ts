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
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function temPermissao(): Promise<boolean> {
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/** Requests permission, fetches the FCM token and stores it on the user doc. */
export async function registerForPush(uid: string): Promise<string | null> {
  try {
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
  // Foreground messages → show a local banner.
  const unsubForeground = messaging().onMessage(async (msg) => {
    const title = msg.notification?.title ?? 'ReparAuto';
    const body = msg.notification?.body ?? '';
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: msg.data ?? {} },
      trigger: null,
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
