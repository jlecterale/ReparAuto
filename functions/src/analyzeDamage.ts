/**
 * Callable proxy: Gemini Vision damage analysis for ONE photo of a car
 * listing. The photo is whitelisted (must be an entry of the car document's
 * `fotos` array — never an arbitrary URL), moderated before the expensive
 * analysis, and the repaired result is cached in the car document keyed by
 * the photo-URL hash so re-renders never spend a new generation (§3.7).
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { SchemaType } from "@google-cloud/vertexai";
import { createHash } from "node:crypto";
import { generateStructured } from "./lib/aiClient";
import { clampInt, repairDamageResult } from "./lib/aiValidate";
import { requireVerifiedUser } from "./lib/guards";
import { moderateImage } from "./lib/moderation";
import { DAMAGE_ANALYSIS_SYSTEM_PROMPT } from "./lib/prompts";
import { consumeAiQuota, FREE_WEEKLY_AI_LIMIT } from "./lib/quota";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PHOTO_INDEX = 19; // cars carry at most 20 photos (see firestore.rules)

const DAMAGE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    damages: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          severity: { type: SchemaType.STRING, enum: ["minor", "moderate", "severe"] },
          x: { type: SchemaType.NUMBER },
          y: { type: SchemaType.NUMBER },
          width: { type: SchemaType.NUMBER },
          height: { type: SchemaType.NUMBER },
        },
        required: ["label", "severity", "x", "y", "width", "height"],
      },
    },
  },
  required: ["summary", "damages"],
};

function isAllowedPhotoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "firebasestorage.googleapis.com" ||
        parsed.hostname.endsWith(".firebasestorage.app"))
    );
  } catch {
    return false;
  }
}

async function fetchImage(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpsError("failed-precondition", "Could not fetch the listing photo.");
  }
  const mimeType = response.headers.get("content-type") ?? "";
  if (!mimeType.startsWith("image/")) {
    throw new HttpsError("failed-precondition", "Listing photo is not an image.");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new HttpsError("failed-precondition", "Listing photo is too large to analyze.");
  }
  return { base64: buffer.toString("base64"), mimeType };
}

export const analyzeDamage = onCall(
  { enforceAppCheck: false, timeoutSeconds: 120 },
  async (request) => {
    const uid = requireVerifiedUser(request);
    const data = (request.data ?? {}) as Record<string, unknown>;
    const carId = typeof data.carId === "string" ? data.carId : "";
    const photoIndex = clampInt(data.photoIndex, 0, MAX_PHOTO_INDEX, -1);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(carId) || photoIndex < 0) {
      throw new HttpsError("invalid-argument", "carId and photoIndex are required.");
    }

    const db = getFirestore();
    const carRef = db.doc(`cars/${carId}`);
    const carSnap = await carRef.get();
    if (!carSnap.exists) {
      throw new HttpsError("not-found", "Listing not found.");
    }
    const fotos = (carSnap.get("fotos") as unknown[] | undefined) ?? [];
    const photoUrl = fotos[photoIndex];
    if (typeof photoUrl !== "string" || !isAllowedPhotoUrl(photoUrl)) {
      throw new HttpsError("failed-precondition", "This photo cannot be analyzed.");
    }

    const photoHash = createHash("sha256").update(photoUrl).digest("hex").slice(0, 32);
    const cache = carSnap.get("damageAnalysis") as Record<string, unknown> | undefined;
    if (cache?.[photoHash]) {
      return { result: cache[photoHash], cached: true, remaining: FREE_WEEKLY_AI_LIMIT };
    }

    const remaining = await consumeAiQuota(uid);
    const image = await fetchImage(photoUrl);
    await moderateImage(image.base64, image.mimeType, uid, photoHash);

    const raw = await generateStructured({
      systemInstruction: DAMAGE_ANALYSIS_SYSTEM_PROMPT,
      parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }],
      schema: DAMAGE_SCHEMA,
      maxOutputTokens: 2048,
    });

    const repaired = repairDamageResult(raw);
    const result = { photoHash, ...repaired, analyzedAt: Date.now() };
    await carRef.update({ [`damageAnalysis.${photoHash}`]: result });
    return { result, cached: false, remaining };
  },
);
