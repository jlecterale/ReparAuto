/**
 * RecarGarage Cloud Functions — push notifications.
 *
 * When a document is created in `notifications/{id}` (the same docs the web and
 * mobile apps already write — e.g. new chat message, listing approved), this
 * sends an FCM push to every device token stored on the recipient's user
 * document (`users/{uid}.fcmTokens`, written by the mobile app).
 *
 * Deploy: `cd functions && npm install && npm run deploy`
 * iOS also requires an APNs Auth Key uploaded in Firebase Console → Cloud
 * Messaging (otherwise FCM cannot deliver to iOS devices).
 */
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

// Keep latency low for Portugal/EU and cap concurrency to control cost.
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

interface NotificationDoc {
  uid?: string;
  titulo?: string;
  mensagem?: string;
  link?: string | null;
  tipo?: string;
}

const FCM_INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

export const pushOnNotification = onDocumentCreated(
  "notifications/{id}",
  async (event) => {
    const data = event.data?.data() as NotificationDoc | undefined;
    if (!data?.uid) return;

    const db = getFirestore();
    const userSnap = await db.doc(`users/${data.uid}`).get();
    const tokens = (userSnap.get("fcmTokens") as string[] | undefined) ?? [];
    if (tokens.length === 0) return;

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: data.titulo ?? "RecarGarage",
        body: data.mensagem ?? "",
      },
      data: { link: data.link ?? "", tipo: data.tipo ?? "" },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });

    // Remove tokens the FCM backend reports as permanently invalid.
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

    logger.info("push sent", {
      uid: data.uid,
      tipo: data.tipo,
      sent: response.successCount,
      failed: response.failureCount,
      pruned: invalid.length,
    });
  },
);
