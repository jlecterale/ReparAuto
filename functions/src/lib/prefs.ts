/**
 * Notification-preference gate for Cloud Functions (plan 3.1).
 *
 * Pure mirror of the web-side normalizeNotificationPreferences semantics
 * (src/lib/alerts.ts) — the two run in separate packages, so the shape
 * contract is pinned by both test suites. Stored prefs are untrusted data:
 * missing, legacy-flat or garbage values must never throw and default to
 * "allowed" (users only stop hearing about things they explicitly muted).
 */

export type PreferenceChannel = 'inApp' | 'push';

type PreferenceGroup = 'mensagem' | 'conta' | 'alerta' | 'preco';

const GROUP_FOR_TIPO: Record<string, PreferenceGroup> = {
  mensagem: 'mensagem',
  alerta: 'alerta',
  preco: 'preco',
};

const LEGACY_KEY_FOR_GROUP: Record<PreferenceGroup, string> = {
  mensagem: 'mensagens',
  conta: 'aprovacao',
  alerta: 'novosAnuncios',
  preco: '',
};

/** True when the user's stored prefs allow this notification tipo on this channel. */
export function preferenceAllows(
  rawPrefs: unknown,
  tipo: unknown,
  channel: PreferenceChannel,
): boolean {
  const group: PreferenceGroup = GROUP_FOR_TIPO[String(tipo)] ?? 'conta';
  if (typeof rawPrefs !== 'object' || rawPrefs === null) return true;
  const prefs = rawPrefs as Record<string, unknown>;

  const groupValue = prefs[group];
  if (typeof groupValue === 'object' && groupValue !== null) {
    const channelValue = (groupValue as Record<string, unknown>)[channel];
    if (typeof channelValue === 'boolean') return channelValue;
    return true;
  }

  const legacyValue = prefs[LEGACY_KEY_FOR_GROUP[group]];
  if (typeof legacyValue === 'boolean') return legacyValue;
  return true;
}
