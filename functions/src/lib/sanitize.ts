/**
 * Input sanitization for everything user-controlled that reaches a prompt
 * (plan 4.1 §2.4). Pure module — no I/O — so it stays fully testable.
 */

/** Tags/markers we use (or attackers use) to delimit prompt context. */
const RESERVED_TAG_PATTERN =
  /<\/?\s*(context|user_request|user_data|system|instructions?)\s*>|\[\s*(SYSTEM|INST|\/INST)\s*\]|role\s*:\s*(system|assistant)/gi;

/**
 * Multilingual prompt-injection markers (PT/EN/ES). A field containing one of
 * these is dropped entirely — per the guardrails we neutralize silently
 * instead of acknowledging the attempt.
 */
const INJECTION_PATTERNS: RegExp[] = [
  /ignor\w*\s+(all\s+|todas?\s+)?(as\s+|las\s+|the\s+)?(previous|prior|above|anterior\w*|acima)?\s*(instructions?|instru[çc][õo]\w*|prompts?)/i,
  /(desconsider\w*|esquec\w*|olvid\w*|forget|disregard)\s+(as\s+|las\s+|the\s+|all\s+)?(instructions?|instru[çc][õo]\w*|instrucciones)/i,
  /you\s+are\s+now|agora\s+(tu\s+)?[ée]s\s|agora\s+voc[êe]\s+[ée]\s|ahora\s+eres/i,
  /system\s*prompt|prompt\s+d[eo]\s+sistema/i,
  /\bDAN\b|jailbreak/i,
  /act\s+as\s+(a|an|the)\s+(system|developer|admin)/i,
  /nov[ao]s?\s+instru[çc][õo]es\s+d[oe]\s+sistema/i,
];

export function containsInjectionMarker(text: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Trim, strip reserved delimiters, collapse whitespace and cap length.
 * Returns '' for non-strings and for fields carrying injection markers.
 */
export function sanitizeUserText(text: string, maxLength: number): string {
  if (typeof text !== 'string') return '';
  const stripped = text.replace(RESERVED_TAG_PATTERN, ' ').replace(/\s+/g, ' ').trim();
  if (containsInjectionMarker(stripped)) return '';
  return stripped.slice(0, maxLength).trim();
}
