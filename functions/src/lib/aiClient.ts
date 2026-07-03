/**
 * Lazy singleton Vertex AI (Gemini) client — the ONLY place that talks to the
 * model. The API surface is structured-output only (§2.5): every call forces
 * `application/json` + a response schema at low temperature, and callers must
 * still run a repair pass over the parsed result.
 *
 * Cost containment lives outside this module (quota, moderation, caching);
 * the last line of defense is the per-day hard cap configured on the
 * Generative Language / Vertex quota page in the Cloud console — set it low.
 */
import { VertexAI, type Part, type ResponseSchema } from "@google-cloud/vertexai";
import { defineString } from "firebase-functions/params";
import { logger } from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";

// Rolling alias (§3.1): `*-latest` auto-upgrades to the current Flash without a
// release, so we never ship a pinned/deprecated version string. Swap to a
// pinned id (or gemini-flash-lite-latest for cheaper text) via env in the
// console if a specific version is ever needed.
const AI_MODEL = defineString("AI_MODEL", { default: "gemini-flash-latest" });
const AI_LOCATION = defineString("AI_LOCATION", { default: "europe-west1" });

let vertexClient: VertexAI | null = null;

function getVertex(): VertexAI {
  if (!vertexClient) {
    vertexClient = new VertexAI({
      project:
        process.env.GCLOUD_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT ?? "",
      location: AI_LOCATION.value(),
    });
  }
  return vertexClient;
}

export interface StructuredCallOptions {
  systemInstruction: string;
  /** User content: sanitized text and/or inline image parts. Variable data last. */
  parts: Part[];
  schema: ResponseSchema;
  /** Safety ceiling — high enough not to truncate the JSON mid-object (§3.3). */
  maxOutputTokens: number;
}

function isRetryable(error: unknown): boolean {
  const code = (error as { code?: number } | null)?.code;
  const message = error instanceof Error ? error.message : "";
  return code === 429 || code === 503 || /\b(429|503)\b/.test(message);
}

const RETRY_DELAYS_MS = [2000, 4000];

/** Calls the model and returns the parsed structured JSON output. */
export async function generateStructured(
  options: StructuredCallOptions,
): Promise<unknown> {
  const model = getVertex().getGenerativeModel({
    model: AI_MODEL.value(),
    systemInstruction: {
      role: "system",
      parts: [{ text: options.systemInstruction }],
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: options.maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema: options.schema,
    },
  });

  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: options.parts }],
      });
      const usage = result.response.usageMetadata;
      // Token observability (§3.8) — debug level only, to calibrate context size.
      logger.debug("ai token usage", {
        model: AI_MODEL.value(),
        in: usage?.promptTokenCount,
        out: usage?.candidatesTokenCount,
        total: usage?.totalTokenCount,
      });
      const text =
        result.response.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("") ?? "";
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
