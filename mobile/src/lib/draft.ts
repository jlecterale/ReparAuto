import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  BodyType,
  Cambio,
  CategoriaIntencao,
  Combustivel,
  Condition,
  ContatoPreferido,
  EspecialidadeOficina,
  EstadoVeiculo,
  TipoPeca,
  Traction,
} from '@/types';

/**
 * Local persistence for in-progress listing forms ("rascunhos").
 *
 * One draft per listing kind. Drafts are stamped with the author's uid so a
 * shared device never leaks a draft across accounts: an owned draft is only
 * visible to the same uid, an anonymous draft is visible to anyone.
 */

export type AdDraftKind = 'carro' | 'peca' | 'oficina' | 'intencao';

export interface AdDraft<T> {
  uid: string | null;
  data: T;
  savedAt: number;
}

/** Snapshot of the car form's raw (string-based) state. */
export interface CarDraftData {
  fotos: string[];
  marca: string;
  modelo: string;
  ano: string;
  km: string;
  preco: string;
  cor: string;
  portas: string;
  combustivel: Combustivel | null;
  cambio: Cambio | null;
  bodyType: BodyType | null;
  seats: string;
  condition: Condition;
  power: string;
  displacement: string;
  traction: Traction | null;
  features: string[];
  estado: EstadoVeiculo;
  local: string;
  descricao: string;
  videoUrl: string;
  telefone: string;
  whatsapp: string;
}

/** Snapshot of the part form's raw state. */
export interface PartDraftData {
  foto: string[];
  tipo: TipoPeca;
  titulo: string;
  categoria: string;
  marca: string;
  modelo: string;
  preco: string;
  estado: string;
  local: string;
  descricao: string;
  telefone: string;
  whatsapp: string;
}

/** Snapshot of the workshop registration form's raw state. */
export interface WorkshopDraftData {
  logo: string[];
  nome: string;
  responsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  website: string;
  videoUrl: string;
  distrito: string;
  localidade: string;
  morada: string;
  descricao: string;
  especialidades: EspecialidadeOficina[];
}

/** Snapshot of the purchase-intent form's raw state. */
export interface IntentDraftData {
  categoria: CategoriaIntencao;
  titulo: string;
  descricao: string;
  marca: string;
  modelo: string;
  anoMin: string;
  precoMax: string;
  kmMax: string;
  distrito: string;
  combustivel: Combustivel[];
  contato: ContatoPreferido;
  telefone: string;
}

const keyFor = (kind: AdDraftKind) => `reparauto_ad_draft_${kind}`;

export async function saveAdDraft<T>(kind: AdDraftKind, data: T, uid: string | null): Promise<void> {
  try {
    const draft: AdDraft<T> = { uid, data, savedAt: Date.now() };
    await AsyncStorage.setItem(keyFor(kind), JSON.stringify(draft));
  } catch {
    // best-effort; ignore storage failures.
  }
}

export async function loadAdDraft<T>(kind: AdDraftKind, uid: string | null): Promise<AdDraft<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(kind));
    if (!raw) return null;
    const draft = JSON.parse(raw) as AdDraft<T>;
    if (!draft || typeof draft !== 'object' || !draft.data || typeof draft.data !== 'object') {
      return null;
    }
    // An owned draft never surfaces for another account (or while logged out).
    if (draft.uid && draft.uid !== uid) return null;
    return draft;
  } catch {
    return null;
  }
}

export async function clearAdDraft(kind: AdDraftKind): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(kind));
  } catch {
    // best-effort; ignore storage failures.
  }
}
