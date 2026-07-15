/**
 * Price-drop alerts (plan 3.1).
 *
 * When an approved car/part listing's price goes down, every user who
 * favourited it gets a 'preco' notification. There is no subscription doc
 * for this — the fan-out derives from users/{uid}.favoritos, which stores
 * prefixed ids (car_<id> / part_<id>), so a single reverse
 * array-contains query finds the audience.
 */
import { onDocumentUpdated, type FirestoreEvent, type Change, type QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { preferenceAllows } from "./lib/prefs";
import { sendPushToUserSnap } from "./lib/pushSender";
import { listingLink, listingTitle, formatPrice } from "./lib/listings";
import type { ListingData } from "./lib/matching";

const FAV_PREFIX: Record<"cars" | "parts", string> = {
  cars: "car_",
  parts: "part_",
};

async function handlePriceDrop(
  event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { id: string }>,
  colecao: "cars" | "parts",
): Promise<void> {
  const before = event.data?.before.data() as ListingData | undefined;
  const after = event.data?.after.data() as ListingData | undefined;
  if (!before || !after) return;
  if (after.status !== "aprovado") return;

  const oldPrice = before.preco;
  const newPrice = after.preco;
  if (typeof oldPrice !== "number" || typeof newPrice !== "number") return;
  if (!Number.isFinite(oldPrice) || !Number.isFinite(newPrice)) return;
  if (newPrice <= 0 || newPrice >= oldPrice) return;

  const id = event.params.id;
  const db = getFirestore();
  const favers = await db
    .collection("users")
    .where("favoritos", "array-contains", FAV_PREFIX[colecao] + id)
    .get();
  if (favers.empty) return;

  const titulo = "Baixou de preço 📉";
  const mensagem = `"${listingTitle(after, colecao)}" baixou de ${formatPrice(oldPrice)} para ${formatPrice(newPrice)}.`;
  const link = listingLink(colecao, id);

  let inApp = 0;
  let pushOnly = 0;
  for (const userDoc of favers.docs) {
    if (userDoc.id === after.criadorUid) continue;
    const prefs = userDoc.get("notifPrefs");
    if (preferenceAllows(prefs, "preco", "inApp")) {
      // The in-app doc also triggers the (pref-gated) push via pushOnNotification.
      await db.collection("notifications").add({
        uid: userDoc.id,
        tipo: "preco",
        titulo,
        mensagem,
        link,
        lida: false,
        dataCriacao: FieldValue.serverTimestamp(),
      });
      inApp++;
    } else if (preferenceAllows(prefs, "preco", "push")) {
      await sendPushToUserSnap(userDoc, { titulo, mensagem, link, tipo: "preco" });
      pushOnly++;
    }
  }

  logger.info("price drop fan-out", { colecao, id, favers: favers.size, inApp, pushOnly });
}

export const onCarPriceDrop = onDocumentUpdated("cars/{id}", (event) =>
  handlePriceDrop(event, "cars"),
);

export const onPartPriceDrop = onDocumentUpdated("parts/{id}", (event) =>
  handlePriceDrop(event, "parts"),
);
