/**
 * Authoritative weekly AI quota (plan 4.1 §2.2, layer 2 of 5).
 *
 * Layers: local UX counter (client) → THIS transaction → Firestore rules deny
 * all client access to `aiUsage` → App Check attestation → per-day hard cap
 * on the Generative Language API quota page (the only layer that survives a
 * compromised client — keep it configured low in the AI Studio / Cloud console).
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { weekKeyFromDate } from "./week";

export const FREE_WEEKLY_AI_LIMIT = 10;

/**
 * Consumes one generation for `uid` and returns how many remain this week.
 * The window key derives from SERVER time — never accepted from the client.
 * Admins bypass the cap.
 */
export async function consumeAiQuota(uid: string): Promise<number> {
  const db = getFirestore();
  const userSnap = await db.doc(`users/${uid}`).get();
  if (userSnap.get("role") === "admin") return FREE_WEEKLY_AI_LIMIT;

  const weekKey = weekKeyFromDate(new Date());
  const usageRef = db.doc(`aiUsage/${uid}_${weekKey}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(usageRef);
    const count = (snap.get("count") as number | undefined) ?? 0;
    if (count >= FREE_WEEKLY_AI_LIMIT) {
      throw new HttpsError("resource-exhausted", "Weekly AI quota exceeded.");
    }
    tx.set(
      usageRef,
      { uid, weekKey, count: count + 1, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return FREE_WEEKLY_AI_LIMIT - (count + 1);
  });
}
