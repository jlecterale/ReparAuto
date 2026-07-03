/**
 * Pure matching logic for alert subscriptions (plan 3.1).
 *
 * No Firebase imports here — this module is unit-tested by the root Jest
 * suite and treats every value as untrusted data coming out of Firestore:
 * missing fields, wrong types and hostile strings must never throw.
 */

/** Loose shape of a cars/parts/services doc — only what matching reads. */
export interface ListingData {
  status?: unknown;
  marca?: unknown;
  modelo?: unknown;
  titulo?: unknown;
  nome?: unknown;
  descricao?: unknown;
  marcaCarro?: unknown;
  modeloCarro?: unknown;
  categoria?: unknown;
  local?: unknown;
  localidade?: unknown;
  distrito?: unknown;
  preco?: unknown;
  anoFabricacao?: unknown;
  km?: unknown;
  combustivel?: unknown;
  cambio?: unknown;
  cor?: unknown;
  portas?: unknown;
  estadoVeiculo?: unknown;
  rodando?: unknown;
  inspecao?: unknown;
  fotos?: unknown;
  tipo?: unknown;
  criadorUid?: unknown;
}

export type ListingCollection = 'cars' | 'parts' | 'services';

export type CategoriaAlerta = 'carros' | 'pecas' | 'oficinas';

const COLLECTION_FOR_CATEGORIA: Record<CategoriaAlerta, ListingCollection> = {
  carros: 'cars',
  pecas: 'parts',
  oficinas: 'services',
};

const MIN_KEYWORD_LENGTH = 2;

/** Lowercases and strips diacritics so "Mégane" matches "megane". */
export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** All searchable text of a listing, normalized, space-joined. */
function listingSearchText(listing: ListingData): string {
  return [
    listing.marca,
    listing.modelo,
    listing.marcaCarro,
    listing.modeloCarro,
    listing.titulo,
    listing.nome,
    listing.descricao,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ');
}

function categoriaAllows(
  categoria: unknown,
  colecao: ListingCollection,
): boolean {
  if (categoria === undefined || categoria === null) return true;
  return COLLECTION_FOR_CATEGORIA[categoria as CategoriaAlerta] === colecao;
}

export interface AlertCriteriaData {
  categoria?: unknown;
  tipoAnuncio?: unknown;
  concelho?: unknown;
  distrito?: unknown;
  marca?: unknown;
}

/** True when the listing satisfies every criterion the subscription sets. */
export function matchCriteria(
  listing: ListingData,
  colecao: ListingCollection,
  criteria: AlertCriteriaData,
): boolean {
  const categoria = criteria.categoria as CategoriaAlerta;
  if (COLLECTION_FOR_CATEGORIA[categoria] !== colecao) return false;

  if (criteria.tipoAnuncio !== undefined && criteria.tipoAnuncio !== null) {
    if (normalizeText(listing.tipo) !== normalizeText(criteria.tipoAnuncio)) return false;
  }
  if (criteria.concelho) {
    const concelho = normalizeText(criteria.concelho);
    const locations = [normalizeText(listing.local), normalizeText(listing.localidade)];
    if (!locations.includes(concelho)) return false;
  }
  if (criteria.distrito) {
    if (normalizeText(listing.distrito) !== normalizeText(criteria.distrito)) return false;
  }
  if (criteria.marca) {
    const marca = normalizeText(criteria.marca);
    const marcas = [normalizeText(listing.marca), normalizeText(listing.marcaCarro)];
    if (!marcas.includes(marca)) return false;
  }
  return true;
}

export interface SearchFiltersData {
  texto?: unknown;
  marca?: unknown;
  modelo?: unknown;
  combustivel?: unknown;
  cambio?: unknown;
  cor?: unknown;
  portas?: unknown;
  concelho?: unknown;
  distrito?: unknown;
  precoMin?: unknown;
  precoMax?: unknown;
  anoMin?: unknown;
  anoMax?: unknown;
  kmMin?: unknown;
  kmMax?: unknown;
  estadoVeiculo?: unknown;
  rodando?: unknown;
  inspecao?: unknown;
  minFotos?: unknown;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function textEquals(listingValue: unknown, filterValue: unknown): boolean {
  return normalizeText(listingValue) === normalizeText(filterValue);
}

function inRange(value: unknown, min: unknown, max: unknown): boolean {
  const v = asNumber(value);
  const lo = asNumber(min);
  const hi = asNumber(max);
  if (lo === undefined && hi === undefined) return true;
  if (v === undefined) return false;
  if (lo !== undefined && v < lo) return false;
  if (hi !== undefined && v > hi) return false;
  return true;
}

/**
 * True when the (car) listing satisfies every filter that is set.
 * Saved-filter alerts are car-shaped, so any other collection never matches.
 * An empty filter object never matches — it would alert on everything.
 */
export function matchFilters(
  listing: ListingData,
  colecao: ListingCollection,
  filters: SearchFiltersData,
): boolean {
  if (colecao !== 'cars') return false;
  const keys = Object.keys(filters).filter(
    (key) => (filters as Record<string, unknown>)[key] !== undefined,
  );
  if (keys.length === 0) return false;

  if (filters.texto !== undefined && !matchKeyword(listing, colecao, filters.texto)) return false;
  if (filters.marca !== undefined && !textEquals(listing.marca, filters.marca)) return false;
  if (filters.modelo !== undefined && !textEquals(listing.modelo, filters.modelo)) return false;
  if (filters.combustivel !== undefined && !textEquals(listing.combustivel, filters.combustivel)) return false;
  if (filters.cambio !== undefined && !textEquals(listing.cambio, filters.cambio)) return false;
  if (filters.cor !== undefined && !textEquals(listing.cor, filters.cor)) return false;
  if (filters.estadoVeiculo !== undefined && !textEquals(listing.estadoVeiculo, filters.estadoVeiculo)) return false;
  if (filters.concelho !== undefined && !textEquals(listing.local, filters.concelho)) return false;
  if (filters.distrito !== undefined && !textEquals(listing.distrito, filters.distrito)) return false;
  if (filters.portas !== undefined && asNumber(listing.portas) !== asNumber(filters.portas)) return false;
  if (!inRange(listing.preco, filters.precoMin, filters.precoMax)) return false;
  if (!inRange(listing.anoFabricacao, filters.anoMin, filters.anoMax)) return false;
  if (!inRange(listing.km, filters.kmMin, filters.kmMax)) return false;
  if (filters.rodando !== undefined && listing.rodando !== filters.rodando) return false;
  if (filters.inspecao !== undefined && listing.inspecao !== filters.inspecao) return false;
  if (filters.minFotos !== undefined) {
    const fotos = Array.isArray(listing.fotos) ? listing.fotos.length : 0;
    const min = asNumber(filters.minFotos);
    if (min !== undefined && fotos < min) return false;
  }
  return true;
}

/** Loose shape of an alertSubscriptions doc — data is untrusted. */
export interface AlertSubscriptionData {
  tipo?: unknown;
  uid?: unknown;
  ativo?: unknown;
  keyword?: unknown;
  categoria?: unknown;
  criteria?: unknown;
  filters?: unknown;
}

/** Dispatches a listing against a subscription by its tipo. */
export function matchesSubscription(
  listing: ListingData,
  colecao: ListingCollection,
  subscription: AlertSubscriptionData,
): boolean {
  switch (subscription.tipo) {
    case 'palavra_chave':
      return matchKeyword(listing, colecao, subscription.keyword, subscription.categoria);
    case 'criterio':
      return (
        typeof subscription.criteria === 'object' &&
        subscription.criteria !== null &&
        matchCriteria(listing, colecao, subscription.criteria as AlertCriteriaData)
      );
    case 'filtro_salvo':
      return (
        typeof subscription.filters === 'object' &&
        subscription.filters !== null &&
        matchFilters(listing, colecao, subscription.filters as SearchFiltersData)
      );
    default:
      return false;
  }
}

/** True when every token of the keyword appears in the listing's text. */
export function matchKeyword(
  listing: ListingData,
  colecao: ListingCollection,
  keyword: unknown,
  categoria?: unknown,
): boolean {
  if (!categoriaAllows(categoria, colecao)) return false;
  const tokens = normalizeText(keyword).split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return false;
  if (tokens.join(' ').length < MIN_KEYWORD_LENGTH) return false;
  const text = listingSearchText(listing);
  return tokens.every((token) => text.includes(token));
}
