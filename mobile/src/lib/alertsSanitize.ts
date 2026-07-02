/**
 * Pure helpers for alert subscriptions and notification preferences —
 * mirrors the web app's `src/lib/alerts.ts` (same algorithms, ported to
 * mobile's `AlertFiltros` field subset). No Firestore imports: every
 * user-supplied string is trimmed/stripped/capped and every number clamped
 * here, then `firestore.rules` re-assert the same bounds server-side — the
 * client is never the source of truth.
 */
import type {
  AlertCriteria,
  AlertFiltros,
  AlertSubscriptionInput,
  CategoriaAlerta,
  ChannelPreferences,
  Combustivel,
  EstadoVeiculo,
  GrupoPreferencia,
  NotificationPreferences,
} from '@/types';

export const MAX_ALERT_SUBSCRIPTIONS = 10;
export const MAX_ALERT_TEXT_LENGTH = 60;
export const MIN_KEYWORD_LENGTH = 2;

const CATEGORIAS_ALERTA: readonly CategoriaAlerta[] = ['carros', 'pecas', 'oficinas'];
const TIPOS_ANUNCIO_PECA: readonly string[] = ['venda', 'desmonte', 'procura'];

const CATEGORIA_LABELS: Record<CategoriaAlerta, string> = {
  carros: 'Carros',
  pecas: 'Peças',
  oficinas: 'Oficinas',
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  mensagem: { inApp: true, push: true },
  conta: { inApp: true, push: true },
  alerta: { inApp: true, push: true },
  preco: { inApp: true, push: true },
};

/** Collapses whitespace, strips control characters/angle brackets and caps the length. */
export function sanitizeAlertText(text: string, maxLength: number): string {
  return text
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim();
}

/** Clamps a number into [min, max] as an integer; non-finite input → fallback. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function clampOptional(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return clampInt(value, min, max, min);
}

function sanitizeCategoria(raw: unknown): CategoriaAlerta | undefined {
  return CATEGORIAS_ALERTA.includes(raw as CategoriaAlerta) ? (raw as CategoriaAlerta) : undefined;
}

/** Sanitizes an AlertFiltros object: strings stripped/capped, numbers clamped. */
export function sanitizeAlertFiltros(raw: AlertFiltros): AlertFiltros {
  const text = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const cleaned = sanitizeAlertText(value, MAX_ALERT_TEXT_LENGTH);
    return cleaned || undefined;
  };
  const texto = text(raw.texto);
  const filters: AlertFiltros = {
    // Free text below the keyword minimum would never match server-side.
    texto: texto && texto.length >= MIN_KEYWORD_LENGTH ? texto : undefined,
    marca: text(raw.marca),
    modelo: text(raw.modelo),
    combustivel: text(raw.combustivel) as Combustivel | undefined,
    distrito: text(raw.distrito),
    concelho: text(raw.concelho),
    precoMin: clampOptional(raw.precoMin, 0, 5_000_000),
    precoMax: clampOptional(raw.precoMax, 0, 5_000_000),
    anoMin: clampOptional(raw.anoMin, 1900, 2100),
    anoMax: clampOptional(raw.anoMax, 1900, 2100),
    kmMin: clampOptional(raw.kmMin, 0, 2_000_000),
    kmMax: clampOptional(raw.kmMax, 0, 2_000_000),
    estadoVeiculo: text(raw.estadoVeiculo) as EstadoVeiculo | undefined,
  };
  (Object.keys(filters) as (keyof AlertFiltros)[]).forEach((key) => {
    if (filters[key] === undefined) delete filters[key];
  });
  return filters;
}

/** Short human label for a saved-filter alert when the user doesn't name it. */
function defaultFilterAlertName(filters: AlertFiltros): string {
  const marcaModelo = [filters.marca, filters.modelo].filter(Boolean).join(' ');
  const local = filters.concelho || filters.distrito;
  const preco =
    filters.precoMax !== undefined
      ? `até ${filters.precoMax.toLocaleString('pt-PT')} €`
      : filters.precoMin !== undefined
        ? `desde ${filters.precoMin.toLocaleString('pt-PT')} €`
        : undefined;
  const parts = [filters.texto, marcaModelo, local, preco].filter(Boolean) as string[];
  if (parts.length === 0) return 'Filtro guardado';
  return sanitizeAlertText(parts.join(' · '), MAX_ALERT_TEXT_LENGTH);
}

/**
 * Validates and sanitizes an alert subscription before it is written.
 * Returns `null` when the input cannot form a meaningful alert.
 */
export function sanitizeAlertSubscriptionInput(
  input: AlertSubscriptionInput,
): AlertSubscriptionInput | null {
  const nome = sanitizeAlertText(input.nome || '', MAX_ALERT_TEXT_LENGTH);
  const ativo = input.ativo !== false;

  if (input.tipo === 'palavra_chave') {
    const keyword = sanitizeAlertText(input.keyword || '', MAX_ALERT_TEXT_LENGTH);
    if (keyword.length < MIN_KEYWORD_LENGTH) return null;
    const categoria = sanitizeCategoria(input.categoria);
    return {
      tipo: 'palavra_chave',
      nome: nome || keyword,
      ativo,
      keyword,
      ...(categoria ? { categoria } : {}),
    };
  }

  if (input.tipo === 'criterio') {
    const categoria = sanitizeCategoria(input.criteria?.categoria);
    if (!categoria) return null;
    const tipoAnuncio = TIPOS_ANUNCIO_PECA.includes(input.criteria.tipoAnuncio || '')
      ? input.criteria.tipoAnuncio
      : undefined;
    const concelho = sanitizeAlertText(input.criteria.concelho || '', MAX_ALERT_TEXT_LENGTH);
    const distrito = sanitizeAlertText(input.criteria.distrito || '', MAX_ALERT_TEXT_LENGTH);
    const marca = sanitizeAlertText(input.criteria.marca || '', MAX_ALERT_TEXT_LENGTH);
    const criteria: AlertCriteria = {
      categoria,
      ...(tipoAnuncio ? { tipoAnuncio } : {}),
      ...(concelho ? { concelho } : {}),
      ...(distrito ? { distrito } : {}),
      ...(marca ? { marca } : {}),
    };
    const defaultName = [marca, concelho || distrito, CATEGORIA_LABELS[categoria]]
      .filter(Boolean)
      .join(' · ');
    return {
      tipo: 'criterio',
      nome: nome || defaultName || CATEGORIA_LABELS[categoria],
      ativo,
      criteria,
    };
  }

  if (input.tipo === 'filtro_salvo') {
    const filters = sanitizeAlertFiltros(input.filters || {});
    if (Object.keys(filters).length === 0) return null;
    return {
      tipo: 'filtro_salvo',
      nome: nome || defaultFilterAlertName(filters),
      ativo,
      filters,
    };
  }

  return null;
}

function normalizeChannel(raw: unknown, both: boolean | undefined): ChannelPreferences {
  const base: ChannelPreferences = both === undefined ? { inApp: true, push: true } : { inApp: both, push: both };
  if (typeof raw !== 'object' || raw === null) return base;
  const channel = raw as Record<string, unknown>;
  return {
    inApp: typeof channel.inApp === 'boolean' ? channel.inApp : base.inApp,
    push: typeof channel.push === 'boolean' ? channel.push : base.push,
  };
}

/**
 * Coerces whatever is stored at users/{uid}.notifPrefs into the current
 * per-group × per-channel shape — including the legacy flat booleans the old
 * web panel wrote ({ mensagens, aprovacao, novosAnuncios }). This document is
 * shared across web and mobile, so both must agree on the same shape.
 */
export function normalizeNotificationPreferences(raw: unknown): NotificationPreferences {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const legacy = (key: string): boolean | undefined =>
    typeof data[key] === 'boolean' ? (data[key] as boolean) : undefined;
  return {
    mensagem: normalizeChannel(data.mensagem, legacy('mensagens')),
    conta: normalizeChannel(data.conta, legacy('aprovacao')),
    alerta: normalizeChannel(data.alerta, legacy('novosAnuncios')),
    preco: normalizeChannel(data.preco, undefined),
  };
}

export type { GrupoPreferencia };
