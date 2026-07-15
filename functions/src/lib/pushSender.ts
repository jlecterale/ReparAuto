/**
 * FCM delivery helper (plan 3.1). Sends a push to every device token on a
 * user document and prunes tokens the FCM backend reports as permanently
 * invalid. Callers are responsible for checking notification preferences
 * first (see lib/prefs.ts) — this module only delivers.
 */
import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions";

const FCM_INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

export interface PushContent {
  titulo: string;
  mensagem: string;
  link?: string | null;
  tipo: string;
}

/** Sends a push to all of the user's devices. Returns how many succeeded. */
export async function sendPushToUserSnap(
  userSnap: DocumentSnapshot,
  content: PushContent,
): Promise<number> {
  const tokens = (userSnap.get("fcmTokens") as string[] | undefined) ?? [];
  if (tokens.length === 0) return 0;

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: content.titulo,
      body: content.mensagem,
    },
    data: { link: content.link ?? "", tipo: content.tipo },
    // channelId must match the channel the mobile app creates in
    // src/lib/push.ts (ANDROID_CHANNEL_ID = 'default'); otherwise Android 8+
    // drops background notifications instead of showing them.
    android: {
      priority: "high",
      notification: { channelId: "default", sound: "default" },
    },
    apns: { payload: { aps: { sound: "default" } } },
  });

  const invalid: string[] = [];
  response.responses.forEach((r, i) => {
    if (!r.success && r.error && FCM_INVALID_TOKEN_CODES.has(r.error.code)) {
      invalid.push(tokens[i]);
    }
  });
  if (invalid.length > 0) {
    await userSnap.ref.update({
      fcmTokens: FieldValue.arrayRemove(...invalid),
    });
  }

  if (response.failureCount > 0) {
    logger.debug("push partial failure", {
      uid: userSnap.id,
      tipo: content.tipo,
      failed: response.failureCount,
      pruned: invalid.length,
    });
  }
  return response.successCount;
}
