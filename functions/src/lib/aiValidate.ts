/**
 * Repair pass over model output (plan 4.1 §2.5). Every LLM response is
 * untrusted data: numbers get clamped, strings get length-capped and reduced
 * to plain text (no HTML/code can survive to the client), enums whitelisted.
 * Pure module — no I/O.
 */

export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_REASONING_LENGTH = 600;
export const MAX_SUMMARY_LENGTH = 300;
export const MAX_DAMAGE_LABEL_LENGTH = 60;
export const MAX_DAMAGE_AREAS = 12;
export const MAX_PRICE_EUR = 1_000_000;

export type DamageSeverity = 'minor' | 'moderate' | 'severe';

export interface DamageArea {
  label: string;
  severity: DamageSeverity;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RepairedDamageResult {
  summary: string;
  damages: DamageArea[];
}

export interface RepairedPriceSuggestion {
  priceMin: number;
  priceRecommended: number;
  priceMax: number;
  reasoning: string;
}

export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : NaN;
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function clampFraction(value: unknown): number | null {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(1, Math.max(0, num));
}

/** Strip HTML tags, code fences and backticks; collapse whitespace; cap length. */
export function toPlainText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/```[a-z]*\n?/gi, ' ')
    .replace(/`/g, ' ')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*\n\s*/g, '\n\n')
    .trim()
    .slice(0, maxLength)
    .trim();
}

export function repairDescription(raw: unknown): string | null {
  const description = toPlainText(
    (raw as { description?: unknown } | null)?.description,
    MAX_DESCRIPTION_LENGTH,
  );
  return description.length > 0 ? description : null;
}

export function repairPriceSuggestion(raw: unknown): RepairedPriceSuggestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const recommended = clampInt(obj.priceRecommended, 0, MAX_PRICE_EUR, 0);
  if (recommended <= 0) return null;
  const min = clampInt(obj.priceMin, 0, MAX_PRICE_EUR, recommended);
  const max = clampInt(obj.priceMax, 0, MAX_PRICE_EUR, recommended);
  const [priceMin, priceRecommended, priceMax] = [min, recommended, max].sort((a, b) => a - b);
  return {
    priceMin,
    priceRecommended,
    priceMax,
    reasoning: toPlainText(obj.reasoning, MAX_REASONING_LENGTH),
  };
}

const SEVERITIES: readonly DamageSeverity[] = ['minor', 'moderate', 'severe'];

export function repairDamageResult(raw: unknown): RepairedDamageResult {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rawDamages = Array.isArray(obj.damages) ? obj.damages : [];
  const damages: DamageArea[] = [];
  for (const entry of rawDamages) {
    if (damages.length >= MAX_DAMAGE_AREAS) break;
    if (!entry || typeof entry !== 'object') continue;
    const d = entry as Record<string, unknown>;
    const x = clampFraction(d.x);
    const y = clampFraction(d.y);
    const width = clampFraction(d.width);
    const height = clampFraction(d.height);
    if (x === null || y === null || !width || !height) continue;
    const label = toPlainText(d.label, MAX_DAMAGE_LABEL_LENGTH);
    if (!label) continue;
    const severity = SEVERITIES.includes(d.severity as DamageSeverity)
      ? (d.severity as DamageSeverity)
      : 'minor';
    damages.push({ label, severity, x, y, width, height });
  }
  return { summary: toPlainText(obj.summary, MAX_SUMMARY_LENGTH), damages };
}
