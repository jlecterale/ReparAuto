/**
 * Alert-subscription matching (plan 3.1).
 *
 * When a listing transitions to 'aprovado' on cars/parts/services, it is
 * evaluated against every active alert subscription (keyword, criteria or
 * saved filter — pure logic in lib/matching.ts). Each matching user gets a
 * single 'alerta' notification (even if several of their alerts match) and
 * every matching subscription has its novosResultados counter bumped.
 *
 * v1 iterates the active subscriptions in the function; if the collection
 * grows, pre-filter with indexed queries per categoria/marca/concelho.
 */
import { onDocumentUpdated, type FirestoreEvent, type Change, type QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { matchesSubscription, type ListingCollection, type ListingData } from "./lib/matching";
import { preferenceAllows } from "./lib/prefs";
import { sendPushToUserSnap } from "./lib/pushSender";
import { listingLink, listingTitle } from "./lib/listings";

const BATCH_LIMIT = 400; // Firestore batches cap at 500 writes.

async function handleListingApproved(
  event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { id: string }>,
  colecao: ListingCollection,
): Promise<void> {
  const before = event.data?.before.data() as ListingData | undefined;
  const after = event.data?.after.data() as ListingData | undefined;
  if (!before || !after) return;
  if (before.status === "aprovado" || after.status !== "aprovado") return;

  const db = getFirestore();
  const subsSnap = await db
    .collection("alertSubscriptions")
    .where("ativo", "==", true)
    .get();
  if (subsSnap.empty) return;

  const id = event.params.id;
  const matchesByUid = new Map<string, QueryDocumentSnapshot[]>();
  for (const subDoc of subsSnap.docs) {
    const sub = subDoc.data();
    const uid = typeof sub.uid === "string" ? sub.uid : "";
    if (!uid || uid === after.criadorUid) continue;
    if (!matchesSubscription(after, colecao, sub)) continue;
    const list = matchesByUid.get(uid) ?? [];
    list.push(subDoc);
    matchesByUid.set(uid, list);
  }
  if (matchesByUid.size === 0) return;

  // Bump the unseen counter on every matching subscription.
  const allMatches = Array.from(matchesByUid.values()).flat();
  for (let i = 0; i < allMatches.length; i += BATCH_LIMIT) {
    const batch = db.batch();
    allMatches.slice(i, i + BATCH_LIMIT).forEach((subDoc) => {
      batch.update(subDoc.ref, {
        novosResultados: FieldValue.increment(1),
        ultimaNotificacao: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  const titulo = "Novo anúncio para o seu alerta 🔔";
  const link = listingLink(colecao, id);
  const nomeAnuncio = listingTitle(after, colecao);

  let notified = 0;
  for (const [uid, subDocs] of matchesByUid) {
    const alertName = typeof subDocs[0].get("nome") === "string" ? subDocs[0].get("nome") : "";
    const mensagem = alertName
      ? `"${nomeAnuncio}" corresponde ao alerta "${alertName}".`
      : `"${nomeAnuncio}" corresponde a um dos seus alertas.`;

    const userSnap = await db.doc(`users/${uid}`).get();
    const prefs = userSnap.get("notifPrefs");
    if (preferenceAllows(prefs, "alerta", "inApp")) {
      await db.collection("notifications").add({
        uid,
        tipo: "alerta",
        titulo,
        mensagem,
        link,
        lida: false,
        dataCriacao: FieldValue.serverTimestamp(),
      });
      notified++;
    } else if (preferenceAllows(prefs, "alerta", "push")) {
      await sendPushToUserSnap(userSnap, { titulo, mensagem, link, tipo: "alerta" });
      notified++;
    }
  }

  logger.info("alert match fan-out", {
    colecao,
    id,
    activeSubs: subsSnap.size,
    matchedSubs: allMatches.length,
    users: matchesByUid.size,
    notified,
  });
}

export const onCarApproved = onDocumentUpdated("cars/{id}", (event) =>
  handleListingApproved(event, "cars"),
);

export const onPartApproved = onDocumentUpdated("parts/{id}", (event) =>
  handleListingApproved(event, "parts"),
);

export const onServiceApproved = onDocumentUpdated("services/{id}", (event) =>
  handleListingApproved(event, "services"),
);
