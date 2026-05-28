import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import app from '@/lib/firebase';

let messaging: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messaging) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('FCM requires a browser with service worker support');
    }
    messaging = getMessaging(app);
  }
  return messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const m = getMessagingInstance();
    const token = await getToken(m, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
    });
    return token;
  } catch {
    return null;
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void): (() => void) | null {
  try {
    const m = getMessagingInstance();
    return onMessage(m, callback);
  } catch {
    return null;
  }
}
