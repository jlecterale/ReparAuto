/**
 * Pure helpers for alert subscriptions and notification preferences.
 * No I/O here — everything is unit-testable without mocks. User-supplied
 * text is never trusted: it is trimmed, stripped and capped before any
 * write (the client is not the source of truth; Firestore rules re-check
 * bounds server-side).
 */

/** Collapses whitespace, strips control characters and caps the length. */
export function sanitizeAlertText(text: string, maxLength: number): string {
  return text
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
    .trim();
}

import type {
  AlertSubscriptionInput,
  CategoriaAlerta,
  ChannelPreferences,
  GrupoPreferencia,
  NotificationPreferences,
} from '@/types/alertas';
import type { TipoNotificacao } from '@/types/notificacao';
import type { SearchFilters } from '@/types/busca';

export const MAX_ALERT_SUBSCRIPTIONS = 20;
export const MAX_ALERT_TEXT_LENGTH = 60;
export const MIN_KEYWORD_LENGTH = 2;

const CATEGORIAS_ALERTA: readonly CategoriaAlerta[] = ['carros', 'pecas', 'oficinas'];
const TIPOS_ANUNCIO_PECA: readonly string[] = ['venda', 'desmonte', 'procura'];

/** PT labels used only to derive a default alert name. */
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

function normalizeChannel(raw: unknown, both: boolean | undefined): ChannelPreferences {
  const base: ChannelPreferences = both === undefined
    ? { inApp: true, push: true }
    : { inApp: both, push: both };
  if (typeof raw !== 'object' || raw === null) return base;
  const channel = raw as Record<string, unknown>;
  return {
    inApp: typeof channel.inApp === 'boolean' ? channel.inApp : base.inApp,
    push: typeof channel.push === 'boolean' ? channel.push : base.push,
  };
}

/**
 * Coerces whatever is stored at users/{uid}.notifPrefs into the current
 * per-group × per-channel shape. Handles the legacy flat booleans
 * ({ mensagens, aprovacao, novosAnuncios }) and partial/garbage data —
 * stored data is a system boundary and is never trusted as-is.
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

/** Which preference group governs a given notification tipo. */
export function preferenceGroupForTipo(tipo: TipoNotificacao): GrupoPreferencia {
  switch (tipo) {
    case 'mensagem':
      return 'mensagem';
    case 'alerta':
      return 'alerta';
    case 'preco':
      return 'preco';
    default:
      return 'conta';
  }
}

/** Clamps a number into [min, max] as an integer; non-finite input → fallback. */
export function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function sanitizeCategoria(raw: unknown): CategoriaAlerta | undefined {
  return CATEGORIAS_ALERTA.includes(raw as CategoriaAlerta) ? (raw as CategoriaAlerta) : undefined;
}

/**
 * Validates and sanitizes an alert subscription before it is written.
 * Returns `null` when the input cannot form a meaningful alert. Every string
 * is stripped/capped and every enum whitelisted — the Firestore rules
 * re-assert the same bounds as the next defense layer.
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
    const criteria = {
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
    const filters = sanitizeSearchFilters(input.filters || {});
    if (Object.keys(filters).length === 0) return null;
    return {
      tipo: 'filtro_salvo',
      nome: nome || 'Filtro guardado',
      ativo,
      filters,
    };
  }

  return null;
}

function clampOptional(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return clampInt(value, min, max, min);
}

/** Sanitizes a SearchFilters object: strings stripped/capped, numbers clamped. */
export function sanitizeSearchFilters(raw: SearchFilters): SearchFilters {
  const text = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const cleaned = sanitizeAlertText(value, MAX_ALERT_TEXT_LENGTH);
    return cleaned || undefined;
  };
  const bool = (value: unknown): boolean | undefined =>
    typeof value === 'boolean' ? value : undefined;

  const texto = text(raw.texto);
  const filters: SearchFilters = {
    // Free text below the keyword minimum would never match server-side.
    texto: texto && texto.length >= MIN_KEYWORD_LENGTH ? texto : undefined,
    marca: text(raw.marca),
    modelo: text(raw.modelo),
    combustivel: text(raw.combustivel) as SearchFilters['combustivel'],
    cambio: text(raw.cambio) as SearchFilters['cambio'],
    cor: text(raw.cor),
    portas: clampOptional(raw.portas, 2, 9),
    concelho: text(raw.concelho),
    distrito: text(raw.distrito),
    precoMin: clampOptional(raw.precoMin, 0, 5_000_000),
    precoMax: clampOptional(raw.precoMax, 0, 5_000_000),
    anoMin: clampOptional(raw.anoMin, 1900, 2100),
    anoMax: clampOptional(raw.anoMax, 1900, 2100),
    kmMin: clampOptional(raw.kmMin, 0, 2_000_000),
    kmMax: clampOptional(raw.kmMax, 0, 2_000_000),
    estadoVeiculo: text(raw.estadoVeiculo) as SearchFilters['estadoVeiculo'],
    rodando: bool(raw.rodando),
    inspecao: bool(raw.inspecao),
    minFotos: clampOptional(raw.minFotos, 0, 7),
  };
  // Drop unset keys so an alert doc only stores what the user actually chose.
  Object.keys(filters).forEach((key) => {
    if (filters[key as keyof SearchFilters] === undefined) delete filters[key as keyof SearchFilters];
  });
  return filters;
}
