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
import { preferenceAllows } from "./lib/prefs";
import { sendPushToUserSnap } from "./lib/pushSender";

initializeApp();

// Keep latency low for Portugal/EU and cap concurrency to control cost.
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

export { onCarApproved, onPartApproved, onServiceApproved } from "./onListingApproved";
export { onCarPriceDrop, onPartPriceDrop } from "./onListingPriceDrop";

interface NotificationDoc {
  uid?: string;
  titulo?: string;
  mensagem?: string;
  link?: string | null;
  tipo?: string;
}

export const pushOnNotification = onDocumentCreated(
  "notifications/{id}",
  async (event) => {
    const data = event.data?.data() as NotificationDoc | undefined;
    if (!data?.uid) return;

    const db = getFirestore();
    const userSnap = await db.doc(`users/${data.uid}`).get();

    // The user's per-type push preference is enforced here — the one place
    // every in-app notification funnels through before becoming a push.
    if (!preferenceAllows(userSnap.get("notifPrefs"), data.tipo, "push")) {
      return;
    }

    const sent = await sendPushToUserSnap(userSnap, {
      titulo: data.titulo ?? "RecarGarage",
      mensagem: data.mensagem ?? "",
      link: data.link,
      tipo: data.tipo ?? "",
    });

    logger.info("push sent", { uid: data.uid, tipo: data.tipo, sent });
  },
);

/**
 * Alerts every admin when a new listing lands for moderation. Runs server-side
 * on creation of cars/parts/services (so it covers listings created from the web
 * and from mobile alike), writing one `info` notification per admin. The
 * `pushOnNotification` trigger above then turns each doc into an FCM push, so the
 * admin gets both an in-app notification and a push that deep-links to `/admin`.
 */
type ListingKind = "carro" | "peca" | "oficina";

async function notifyAdminsOfPendingListing(
  data: Record<string, unknown> | undefined,
  kind: ListingKind,
): Promise<void> {
  if (!data || data.status !== "pendente") return;

  const db = getFirestore();
  const adminsSnap = await db
    .collection("users")
    .where("role", "==", "admin")
    .get();
  if (adminsSnap.empty) return;

  const label =
    kind === "carro" ? "Carro" : kind === "peca" ? "Peça" : "Oficina";
  const nome =
    kind === "carro"
      ? `${data.marca ?? ""} ${data.modelo ?? ""}`.trim()
      : kind === "peca"
        ? String(data.titulo ?? "")
        : String(data.nome ?? "");
  const mensagem = nome
    ? `${label} "${nome}" aguarda revisão.`
    : `Um novo anúncio (${label.toLowerCase()}) aguarda revisão.`;

  const batch = db.batch();
  adminsSnap.docs.forEach((adminDoc) => {
    batch.set(db.collection("notifications").doc(), {
      uid: adminDoc.id,
      tipo: "info",
      titulo: "Novo anúncio pendente",
      mensagem,
      link: "/admin",
      lida: false,
      dataCriacao: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  logger.info("admin pending alert", { kind, admins: adminsSnap.size });
}

export const notifyAdminsOnCarPending = onDocumentCreated(
  "cars/{id}",
  async (event) =>
    notifyAdminsOfPendingListing(event.data?.data(), "carro"),
);

export const notifyAdminsOnPartPending = onDocumentCreated(
  "parts/{id}",
  async (event) =>
    notifyAdminsOfPendingListing(event.data?.data(), "peca"),
);

export const notifyAdminsOnServicePending = onDocumentCreated(
  "services/{id}",
  async (event) =>
    notifyAdminsOfPendingListing(event.data?.data(), "oficina"),
);
