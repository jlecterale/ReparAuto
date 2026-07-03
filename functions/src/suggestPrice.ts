/**
 * Callable proxy: suggests a price range for a vehicle, anchored on real
 * market data (median/quartiles of approved comparable listings) computed
 * server-side, then explained by the model. Output is clamped/reordered by
 * the repair pass before returning.
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { Type } from "@google/genai";
import { GEMINI_API_KEY, generateStructured } from "./lib/aiClient";
import { clampInt, repairPriceSuggestion, MAX_PRICE_EUR } from "./lib/aiValidate";
import { requireVerifiedUser } from "./lib/guards";
import { PRICE_SUGGESTION_SYSTEM_PROMPT, userDataBlock } from "./lib/prompts";
import { consumeAiQuota } from "./lib/quota";
import { buildVehicleFacts } from "./lib/vehicleFacts";

const PRICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    priceMin: { type: Type.INTEGER },
    priceRecommended: { type: Type.INTEGER },
    priceMax: { type: Type.INTEGER },
    reasoning: { type: Type.STRING },
  },
  required: ["priceMin", "priceRecommended", "priceMax", "reasoning"],
};

interface MarketStats {
  sampleSize: number;
  medianEur?: number;
  p25Eur?: number;
  p75Eur?: number;
}

/** Median/quartiles of approved listings for the same marca/modelo. */
async function getMarketStats(marca: string, modelo: string): Promise<MarketStats> {
  const snap = await getFirestore()
    .collection("cars")
    .where("status", "==", "aprovado")
    .where("marca", "==", marca)
    .where("modelo", "==", modelo)
    .limit(60)
    .get();
  const prices = snap.docs
    .map((doc) => doc.get("preco") as unknown)
    .filter((p): p is number => typeof p === "number" && p > 0)
    .sort((a, b) => a - b);
  if (prices.length === 0) return { sampleSize: 0 };
  const at = (fraction: number) => prices[Math.min(prices.length - 1, Math.floor(fraction * prices.length))];
  return {
    sampleSize: prices.length,
    medianEur: at(0.5),
    p25Eur: at(0.25),
    p75Eur: at(0.75),
  };
}

export const suggestPrice = onCall(
  { enforceAppCheck: false, secrets: [GEMINI_API_KEY] },
  async (request) => {
    const uid = requireVerifiedUser(request);
    const facts = buildVehicleFacts(request.data);
    const askingPrice = clampInt(
      (request.data as Record<string, unknown> | null)?.preco,
      0,
      MAX_PRICE_EUR,
      0,
    );
    const market = await getMarketStats(facts.marca, facts.modelo);
    const remaining = await consumeAiQuota(uid);

    const raw = await generateStructured({
      systemInstruction: PRICE_SUGGESTION_SYSTEM_PROMPT,
      parts: [
        {
          text: userDataBlock({
            ...facts,
            precoPretendido: askingPrice > 0 ? askingPrice : undefined,
            mercado: market.sampleSize > 0 ? market : undefined,
          }),
        },
      ],
      schema: PRICE_SCHEMA,
      maxOutputTokens: 512,
    });

    const suggestion = repairPriceSuggestion(raw);
    if (!suggestion) {
      throw new HttpsError("internal", "Unusable price suggestion from model.");
    }
    return { ...suggestion, marketSampleSize: market.sampleSize, remaining };
  },
);
