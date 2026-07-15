// Audio → listing extraction core (plan 24). Pure logic shared by the
// /api/listing-from-audio route: Gemini response schemas, prompts, and
// sanitizers that turn the model's raw JSON into safe, form-ready fields.
// Anything the model returns outside the domain (unknown enum, absurd number)
// is dropped — a missing field is always better than an invented one.

import type { BodyType, Cambio, Combustivel, Condition, EstadoVeiculo, Traction } from '@/types/carro';
import type { TipoPeca } from '@/types/peca';
import {
  CATEGORIAS_PECAS,
  CONDICOES_VEICULO,
  EQUIPAMENTOS_CARRO,
  ESTADOS_PECA,
  TIPOS_CAMBIO,
  TIPOS_CARROCERIA,
  TIPOS_COMBUSTIVEL,
  TIPOS_TRACAO,
} from '@/lib/listingOptions';
import { getAllConcelhos, getDistritoForConcelho } from '@/lib/geo';
import marcasModelos from '@/data/marcas-modelos.json';
import {
  CAR_DISPLACEMENT_MAX,
  CAR_DOORS_MAX,
  CAR_DOORS_MIN,
  CAR_KM_MAX,
  CAR_POWER_MAX,
  CAR_PRICE_MAX,
  CAR_SEATS_MIN,
  CAR_YEAR_MIN,
  carYearMax,
  maxSeatsForBodyType,
} from '@/lib/carSpec';

const ESTADOS_VEICULO: readonly EstadoVeiculo[] = ['pronto', 'manutencao'];

export interface CarAudioFields {
  marca?: string;
  modelo?: string;
  cor?: string;
  combustivel?: Combustivel;
  cambio?: Cambio;
  bodyType?: BodyType;
  condition?: Condition;
  traction?: Traction;
  estadoVeiculo?: EstadoVeiculo;
  anoFabricacao?: number;
  km?: number;
  preco?: number;
  portas?: number;
  seats?: number;
  power?: number;
  displacement?: number;
  features?: string[];
  local?: string;
  distrito?: string;
  descricao?: string;
}

const DESCRIPTION_MAX_LENGTH = 2000;

interface BrandCatalogEntry {
  marca: string;
  modelos: string[];
}
const BRAND_CATALOG = marcasModelos as BrandCatalogEntry[];

/** Parses an integer within [min, max]; anything else is dropped. */
const intInRange = (value: unknown, min: number, max: number): number | undefined => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) return undefined;
  return n;
};

/** Parses a finite number within [min, max]; anything else is dropped. */
const numberInRange = (value: unknown, min: number, max: number): number | undefined => {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
};

const cleanString = (value: unknown, maxLength: number): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
};

/** Accent- and case-insensitive match of `value` against canonical `options`. */
function matchOption<T extends string>(value: unknown, options: readonly T[]): T | undefined {
  if (typeof value !== 'string') return undefined;
  const wanted = normalize(value);
  if (!wanted) return undefined;
  return options.find((opt) => normalize(opt) === wanted);
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Canonicalizes brand/model against the catalog; unknown values stay as-is. */
function matchBrandAndModel(rawMarca: unknown, rawModelo: unknown): { marca?: string; modelo?: string } {
  const marca = cleanString(rawMarca, 60);
  const modelo = cleanString(rawModelo, 60);
  if (!marca) return { marca, modelo };
  const entry = BRAND_CATALOG.find((b) => normalize(b.marca) === normalize(marca));
  if (!entry) return { marca, modelo };
  return {
    marca: entry.marca,
    modelo: modelo ? matchOption(modelo, entry.modelos) ?? modelo : modelo,
  };
}

/** Resolves a spoken locality to a canonical concelho + distrito when known. */
function matchLocality(rawLocal: unknown): { local?: string; distrito?: string } {
  const local = cleanString(rawLocal, 60);
  if (!local) return {};
  const concelho = matchOption(local, getAllConcelhos());
  if (!concelho) return { local };
  return { local: concelho, distrito: getDistritoForConcelho(concelho) };
}

export function sanitizeCarFields(raw: unknown): CarAudioFields {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const fields: CarAudioFields = {
    ...matchBrandAndModel(source.marca, source.modelo),
    ...matchLocality(source.local),
    cor: cleanString(source.cor, 30),
    descricao: cleanString(source.descricao, DESCRIPTION_MAX_LENGTH),
    combustivel: matchOption(source.combustivel, TIPOS_COMBUSTIVEL as readonly Combustivel[]),
    cambio: matchOption(source.cambio, TIPOS_CAMBIO as readonly Cambio[]),
    bodyType: matchOption(source.bodyType, TIPOS_CARROCERIA),
    condition: matchOption(source.condition, CONDICOES_VEICULO),
    traction: matchOption(source.traction, TIPOS_TRACAO),
    estadoVeiculo: matchOption(source.estadoVeiculo, ESTADOS_VEICULO),
    anoFabricacao: intInRange(source.anoFabricacao, CAR_YEAR_MIN, carYearMax()),
    km: intInRange(source.km, 0, CAR_KM_MAX),
    preco: numberInRange(source.preco, 1, CAR_PRICE_MAX),
    portas: intInRange(source.portas, CAR_DOORS_MIN, CAR_DOORS_MAX),
    power: intInRange(source.power, 1, CAR_POWER_MAX),
    displacement: intInRange(source.displacement, 1, CAR_DISPLACEMENT_MAX),
  };
  // Seats depend on the (already sanitized) body type: vans/minibuses go past 9.
  fields.seats = intInRange(source.seats, CAR_SEATS_MIN, maxSeatsForBodyType(fields.bodyType));
  if (Array.isArray(source.features)) {
    const features = source.features
      .map((feature) => matchOption(feature, EQUIPAMENTOS_CARRO))
      .filter((feature): feature is (typeof EQUIPAMENTOS_CARRO)[number] => feature !== undefined);
    if (features.length > 0) fields.features = features;
  }
  return pruneUndefined(fields);
}

const TIPOS_PECA: readonly TipoPeca[] = ['venda', 'desmonte', 'procura'];

export interface PartAudioFields {
  tipo?: TipoPeca;
  titulo?: string;
  categoria?: string;
  estado?: string;
  marcaCarro?: string;
  modeloCarro?: string;
  preco?: number;
  numeroOEM?: string;
  local?: string;
  distrito?: string;
  descricao?: string;
}

export function sanitizePartFields(raw: unknown): PartAudioFields {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const source = raw as Record<string, unknown>;
  const brand = matchBrandAndModel(source.marcaCarro, source.modeloCarro);
  const fields: PartAudioFields = {
    tipo: matchOption(source.tipo, TIPOS_PECA),
    titulo: cleanString(source.titulo, 100),
    categoria: matchOption(source.categoria, CATEGORIAS_PECAS),
    estado: matchOption(source.estado, ESTADOS_PECA),
    marcaCarro: brand.marca,
    modeloCarro: brand.modelo,
    preco: numberInRange(source.preco, 1, CAR_PRICE_MAX),
    numeroOEM: cleanString(source.numeroOEM, 40),
    descricao: cleanString(source.descricao, DESCRIPTION_MAX_LENGTH),
    ...matchLocality(source.local),
  };
  return pruneUndefined(fields);
}

function pruneUndefined<T extends object>(fields: T): T {
  const record = fields as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (record[key] === undefined) delete record[key];
  }
  return fields;
}

export type AudioListingKind = 'carro' | 'peca';

/** Hard cap for uploaded/recorded audio: base64 inflation (+33%) must stay under Gemini's 20 MB inline request limit. */
export const AUDIO_MAX_BYTES = 12 * 1024 * 1024;
export const AUDIO_MAX_MB = 12;

// Gemini officially supports wav/mp3/aiff/aac/ogg/flac. Browsers, expo-audio
// and file pickers report several aliases for these; normalize them here.
const GEMINI_MIME_BY_ALIAS: Record<string, string> = {
  'audio/wav': 'audio/wav',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/mpeg': 'audio/mp3',
  'audio/mp3': 'audio/mp3',
  'audio/aac': 'audio/aac',
  'audio/aacp': 'audio/aac',
  // m4a is an AAC stream in an MP4 container; Gemini handles it as AAC.
  'audio/mp4': 'audio/aac',
  'audio/x-m4a': 'audio/aac',
  'audio/m4a': 'audio/aac',
  'audio/ogg': 'audio/ogg',
  'audio/opus': 'audio/ogg',
  'audio/flac': 'audio/flac',
  'audio/x-flac': 'audio/flac',
  'audio/aiff': 'audio/aiff',
  'audio/x-aiff': 'audio/aiff',
};

const GEMINI_MIME_BY_EXTENSION: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mp3',
  aac: 'audio/aac',
  m4a: 'audio/aac',
  mp4: 'audio/aac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  flac: 'audio/flac',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
};

/**
 * Maps a reported MIME type (and optionally a file name, for pickers that
 * report `application/octet-stream`) to the canonical Gemini audio MIME type.
 * Returns undefined when the audio is not in a supported format.
 */
export function geminiAudioMimeType(mimeType: string, fileName?: string): string | undefined {
  const base = mimeType.split(';')[0].trim().toLowerCase();
  const fromMime = GEMINI_MIME_BY_ALIAS[base];
  if (fromMime) return fromMime;
  const extension = fileName?.split('.').pop()?.toLowerCase();
  return extension ? GEMINI_MIME_BY_EXTENSION[extension] : undefined;
}

// Gemini structured-output schemas (REST/`@google/genai` format). Every field
// is nullable: the model must leave out anything the speaker didn't say.
const nullable = <T extends Record<string, unknown>>(schema: T) => ({ ...schema, nullable: true });

export const CAR_AUDIO_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    transcript: nullable({ type: 'STRING', description: 'Transcrição fiel do áudio.' }),
    marca: nullable({ type: 'STRING', description: 'Marca do veículo, nome canónico (ex.: BMW, Mercedes-Benz).' }),
    modelo: nullable({ type: 'STRING' }),
    anoFabricacao: nullable({ type: 'INTEGER', description: 'Ano de fabricação (4 dígitos).' }),
    km: nullable({ type: 'INTEGER', description: 'Quilometragem em km.' }),
    preco: nullable({ type: 'NUMBER', description: 'Preço pedido, apenas o número.' }),
    cor: nullable({ type: 'STRING' }),
    portas: nullable({ type: 'INTEGER' }),
    seats: nullable({ type: 'INTEGER', description: 'Número de lugares.' }),
    power: nullable({ type: 'INTEGER', description: 'Potência em cavalos (cv).' }),
    displacement: nullable({ type: 'INTEGER', description: 'Cilindrada em cc.' }),
    combustivel: nullable({ type: 'STRING', enum: [...TIPOS_COMBUSTIVEL] }),
    cambio: nullable({ type: 'STRING', enum: [...TIPOS_CAMBIO], description: 'Caixa de velocidades.' }),
    bodyType: nullable({ type: 'STRING', enum: [...TIPOS_CARROCERIA], description: 'Tipo de carroçaria.' }),
    condition: nullable({ type: 'STRING', enum: [...CONDICOES_VEICULO] }),
    traction: nullable({ type: 'STRING', enum: [...TIPOS_TRACAO] }),
    estadoVeiculo: nullable({
      type: 'STRING',
      enum: ['pronto', 'manutencao'],
      description: '"pronto" se anda/circula; "manutencao" se precisa de reparação.',
    }),
    features: nullable({
      type: 'ARRAY',
      items: { type: 'STRING', enum: [...EQUIPAMENTOS_CARRO] },
      description: 'Equipamento/extras mencionados.',
    }),
    local: nullable({ type: 'STRING', description: 'Localidade/concelho onde o carro está.' }),
    descricao: nullable({
      type: 'STRING',
      description: 'Descrição do anúncio em português, 2 a 4 frases, apenas com factos ditos no áudio.',
    }),
  },
} as const;

export const PART_AUDIO_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    transcript: nullable({ type: 'STRING', description: 'Transcrição fiel do áudio.' }),
    tipo: nullable({
      type: 'STRING',
      enum: ['venda', 'desmonte', 'procura'],
      description: '"venda" de uma peça, "desmonte" de um carro completo, "procura" se está à procura de uma peça.',
    }),
    titulo: nullable({ type: 'STRING', description: 'Título curto do anúncio (peça + carro).' }),
    categoria: nullable({ type: 'STRING', enum: [...CATEGORIAS_PECAS] }),
    estado: nullable({ type: 'STRING', enum: [...ESTADOS_PECA] }),
    marcaCarro: nullable({ type: 'STRING', description: 'Marca do carro compatível.' }),
    modeloCarro: nullable({ type: 'STRING', description: 'Modelo do carro compatível.' }),
    preco: nullable({ type: 'NUMBER', description: 'Preço pedido, apenas o número.' }),
    numeroOEM: nullable({ type: 'STRING', description: 'Referência/número OEM se ditado.' }),
    local: nullable({ type: 'STRING', description: 'Localidade/concelho.' }),
    descricao: nullable({
      type: 'STRING',
      description: 'Descrição do anúncio em português, 2 a 4 frases, apenas com factos ditos no áudio.',
    }),
  },
} as const;

const PROMPT_RULES = `Regras:
- Preenche apenas o que o vendedor disse. Não inventes nada: campo não mencionado fica null.
- Converte números por extenso em dígitos ("cento e oitenta mil" → 180000; "quatro mil e quinhentos" → 4500).
- O áudio pode estar em português de Portugal ou do Brasil.
- Usa o nome canónico da marca (ex.: "bê-eme-double-u" → "BMW").
- "descricao": redige uma descrição de anúncio limpa e natural em português com base APENAS no que foi dito; null se o áudio não tiver informação útil.
- "transcript": transcrição fiel do que foi dito.
- Responde só com o JSON pedido.`;

export function buildAudioListingPrompt(kind: AudioListingKind): string {
  if (kind === 'peca') {
    return `Ouve o áudio de um vendedor a descrever uma peça de automóvel (ou um carro para desmonte, ou uma peça que procura) para um anúncio num marketplace. Extrai os campos do anúncio.
${PROMPT_RULES}`;
  }
  return `Ouve o áudio de um vendedor a descrever um carro que quer anunciar num marketplace de veículos usados. Extrai os campos do anúncio.
${PROMPT_RULES}`;
}
