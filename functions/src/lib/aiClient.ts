/**
 * Lazy singleton Gemini (Developer API) client — the ONLY place that talks to
 * the model. The API surface is structured-output only (§2.5): every call
 * forces `application/json` + a response schema at low temperature, and callers
 * must still run a repair pass over the parsed result.
 *
 * Provider: Gemini Developer API via `@google/genai` (apiKey), NOT Vertex.
 * The key is a server-only secret — it must never reach a web/RN bundle (§2.6).
 * Set it once with: `firebase functions:secrets:set GEMINI_API_KEY`.
 * Note: unlike Vertex europe-west1, the Developer API has no region pinning —
 * requests may be processed outside the EU (a deliberate, accepted trade-off).
 *
 * Cost containment lives outside this module (quota, moderation, caching); the
 * last line of defense is the per-day hard cap on the Generative Language API
 * quota page in the Google Cloud / AI Studio console — set it low.
 */
import { GoogleGenAI, type Part, type Schema } from "@google/genai";
import { defineSecret, defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

// Server-only API key. Every AI callable must bind it via `secrets:
// [GEMINI_API_KEY]` in its onCall options, or `.value()` throws at runtime.
export const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Rolling alias (§3.1): `*-latest` auto-upgrades to the current Flash without a
// release, so we never ship a pinned/deprecated version string. Swap to a
// pinned id (or gemini-flash-lite-latest for cheaper text) via env in the
// console if a specific version is ever needed.
const AI_MODEL = defineString("AI_MODEL", { default: "gemini-flash-latest" });

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    client = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
  }
  return client;
}

export interface StructuredCallOptions {
  systemInstruction: string;
  /** User content: sanitized text and/or inline image parts. Variable data last. */
  parts: Part[];
  schema: Schema;
  /** Safety ceiling — high enough not to truncate the JSON mid-object (§3.3). */
  maxOutputTokens: number;
}

function isRetryable(error: unknown): boolean {
  const err = error as { code?: number; status?: number } | null;
  const status = err?.status ?? err?.code;
  const message = error instanceof Error ? error.message : "";
  return status === 429 || status === 503 || /\b(429|503)\b/.test(message);
}

const RETRY_DELAYS_MS = [2000, 4000];

/** Calls the model and returns the parsed structured JSON output. */
export async function generateStructured(
  options: StructuredCallOptions,
): Promise<unknown> {
  const ai = getClient();
  const model = AI_MODEL.value();

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: options.parts }],
        config: {
          systemInstruction: options.systemInstruction,
          temperature: 0.4,
          maxOutputTokens: options.maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: options.schema,
        },
      });
      const usage = result.usageMetadata;
      // Token observability (§3.8) — debug level only, to calibrate context size.
      logger.debug("ai token usage", {
        model,
        in: usage?.promptTokenCount,
        out: usage?.candidatesTokenCount,
        total: usage?.totalTokenCount,
      });
      const text = result.text ?? "";
      try {
        return JSON.parse(text);
      } catch {
        logger.warn("ai output failed to parse as JSON", { length: text.length });
        throw new HttpsError("internal", "AI output was not valid JSON.");
      }
    } catch (error) {
      lastError = error;
      if (error instanceof HttpsError || !isRetryable(error) || attempt === RETRY_DELAYS_MS.length) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    }
  }
  if (lastError instanceof HttpsError) throw lastError;
  logger.error("ai call failed", lastError);
  throw new HttpsError("unavailable", "AI provider unavailable.");
}
