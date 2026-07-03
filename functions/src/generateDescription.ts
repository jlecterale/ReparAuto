/**
 * Callable proxy: generates a PT-PT ad description from sanitized vehicle
 * facts. The client never talks to the model (plan 4.1 §0) — this function
 * owns auth, quota, prompt assembly and the output repair pass.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Type } from "@google/genai";
import { GEMINI_API_KEY, generateStructured } from "./lib/aiClient";
import { repairDescription } from "./lib/aiValidate";
import { requireVerifiedUser } from "./lib/guards";
import { DESCRIPTION_SYSTEM_PROMPT, userDataBlock } from "./lib/prompts";
import { consumeAiQuota } from "./lib/quota";
import { buildVehicleFacts } from "./lib/vehicleFacts";

const DESCRIPTION_SCHEMA = {
  type: Type.OBJECT,
  properties: { description: { type: Type.STRING } },
  required: ["description"],
};

export const generateDescription = onCall(
  // enforceAppCheck stays false during the gradual rollout — see guards.ts.
  { enforceAppCheck: false, secrets: [GEMINI_API_KEY] },
  async (request) => {
    const uid = requireVerifiedUser(request);
    const facts = buildVehicleFacts(request.data);
    const remaining = await consumeAiQuota(uid);

    const raw = await generateStructured({
      systemInstruction: DESCRIPTION_SYSTEM_PROMPT,
      parts: [{ text: userDataBlock({ ...facts }) }],
      schema: DESCRIPTION_SCHEMA,
      maxOutputTokens: 1024,
    });

    const description = repairDescription(raw);
    if (!description) {
      throw new HttpsError("internal", "Empty description from model.");
    }
    return { description, remaining };
  },
);
