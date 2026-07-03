/**
 * Image moderation gate (§2.7) — runs BEFORE the expensive damage analysis so
 * disallowed content is blocked early. Keeps a minimal abuse trail
 * (uid + image hash + verdict, no extra PII) in `aiModerationLog`,
 * a server-only collection (clients are denied by firestore.rules).
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { Type } from "@google/genai";
import { logger } from "firebase-functions";
import { generateStructured } from "./aiClient";
import { IMAGE_MODERATION_SYSTEM_PROMPT } from "./prompts";
import { toPlainText } from "./aiValidate";

const MODERATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    allowed: { type: Type.BOOLEAN },
    category: { type: Type.STRING },
  },
  required: ["allowed", "category"],
};

/** Throws failed-precondition when the image is not acceptable. */
export async function moderateImage(
  imageBase64: string,
  mimeType: string,
  uid: string,
  imageHash: string,
): Promise<void> {
  const raw = await generateStructured({
    systemInstruction: IMAGE_MODERATION_SYSTEM_PROMPT,
    parts: [{ inlineData: { data: imageBase64, mimeType } }],
    schema: MODERATION_SCHEMA,
    maxOutputTokens: 128,
  });
  const verdict = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  // Fail closed: anything other than an explicit `allowed: true` blocks.
  const allowed = verdict.allowed === true;
  const category = toPlainText(verdict.category, 30) || "other";

  getFirestore()
    .collection("aiModerationLog")
    .add({ uid, imageHash, allowed, category, createdAt: FieldValue.serverTimestamp() })
    .catch((error) => logger.warn("moderation log write failed", error));

  if (!allowed) {
    throw new HttpsError("failed-precondition", `Image rejected by moderation (${category}).`);
  }
}
