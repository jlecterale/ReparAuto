// Shared domain types — mirror the web app (src/types) so the same Firestore
// documents deserialize identically on mobile.
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type Timestamp = FirebaseFirestoreTypes.Timestamp;

export type Role = 'user' | 'admin';
export type TipoConta = 'particular' | 'profissional';

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  telefone: string;
  localidade: string;
  distrito?: string;
  codigoPostal: string;
  morada: string;
  nif: string;
  tipoConta: TipoConta;
  role: Role;
  bio: string;
  notificacoes: boolean;
  foto: string | null;
  profileCompleted: boolean;
  verificado?: boolean;
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  badges?: string[];
  dataCriacao?: Timestamp;
  dataAtualizacao?: Timestamp;
}

export type EstadoVeiculo = 'pronto' | 'manutencao';
export type Combustivel =
  | 'Gasolina'
  | 'Etanol'
  | 'Flex'
  | 'Diesel'
  | 'Elétrico'
  | 'Híbrido';
export type Cambio = 'Manual' | 'Automático' | 'CVT';
export type StatusAnuncio = 'pendente' | 'aprovado' | 'rejeitado';

export interface Carro {
  id: string;
  marca: string;
  modelo: string;
  anoFabricacao: number;
  anoModelo?: number;
  preco: number;
  km: number;
  combustivel: Combustivel;
  cambio: Cambio;
  cor: string;
  portas: number;
  local: string;
  distrito?: string;
  coordenadas?: { lat: number; lng: number };
  descricao: string;
  estadoVeiculo: EstadoVeiculo;
  tiposManutencao: string[];
  fotos: string[];
  criador: string;
  criadorUid?: string;
  vendedorNome?: string;
  vendedorTelefone?: string;
  vendedorWhatsApp?: string;
  vendedorEmail?: string;
  rodando?: boolean;
  inspecao?: boolean;
  status: StatusAnuncio;
  dataCriacao: Timestamp;
  dataAprovacao?: Timestamp;
  visualizacoes?: number;
  contagemMensagens?: number;
  contagemFavoritos?: number;
}

export type TipoPeca = 'venda' | 'desmonte' | 'procura';
export type FiltroTipoPeca = 'todos' | TipoPeca;

export const TIPO_PECA_LABELS: Record<TipoPeca, string> = {
  venda: 'Venda',
  desmonte: 'Desmonte',
  procura: 'Procura',
};

export interface Peca {
  id: string;
  tipo: TipoPeca;
  titulo: string;
  categoria: string;
  marcaCarro: string;
  modeloCarro?: string;
  preco: number | null;
  estado: string;
  local: string;
  distrito?: string;
  coordenadas?: { lat: number; lng: number };
  contacto?: string;
  vendedorTelefone?: string;
  vendedorWhatsApp?: string;
  vendedorEmail?: string;
  foto?: string;
  criador: string;
  criadorUid?: string;
  vendedorNome?: string;
  descricao: string;
  status: StatusAnuncio;
  dataCriacao: Timestamp;
  dataAprovacao?: Timestamp;
  visualizacoes?: number;
  contagemMensagens?: number;
}

export type EspecialidadeOficina =
  | 'mecanica_convencional'
  | 'preparacao'
  | 'pintura'
  | 'eletrica'
  | 'eletronica'
  | 'estetica_automotiva'
  | 'pneus'
  | 'ar_condicionado'
  | 'classicos_restauro'
  | 'outro';

export const ESPECIALIDADES_LABELS: Record<EspecialidadeOficina, string> = {
  mecanica_convencional: 'Mecânica Convencional',
  preparacao: 'Preparação & Tuning',
  pintura: 'Pintura & Funilaria',
  eletrica: 'Eletricidade',
  eletronica: 'Eletrónica & Diagnóstico',
  estetica_automotiva: 'Estética Automóvel (Detailing)',
  pneus: 'Pneus & Alinhamento',
  ar_condicionado: 'Ar Condicionado',
  classicos_restauro: 'Clássicos & Restauro',
  outro: 'Outro Serviço',
};

// ---------- Chat ----------
export type ListingType = 'carro' | 'peca' | 'intencao';

export interface Mensagem {
  id: string;
  listingId: string;
  listingType: ListingType;
  listingTitle: string;
  fromUid: string;
  fromNome: string;
  toUid: string;
  toNome: string;
  participants: string[];
  mensagem: string;
  lida: boolean;
  dataCriacao: Timestamp;
}

/** Derived inbox entry (one per listing + counterpart). */
export interface Conversa {
  chaveConversa: string;
  listingId: string;
  listingType: ListingType;
  listingTitle: string;
  outroUid: string;
  outroNome: string;
  ultimaMensagem: string;
  ultimaData: Timestamp;
  naoLidas: number;
}

// ---------- Notificações ----------
export type TipoNotificacao = 'aprovado' | 'rejeitado' | 'info' | 'mensagem';

export interface Notificacao {
  id: string;
  uid: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link?: string | null;
  lida: boolean;
  dataCriacao: Timestamp;
}

/** Workshops live in the `services` collection (web type: OficinaMecanico). */
export interface Oficina {
  id: string;
  criador: string;
  nome: string;
  descricao: string;
  responsavel: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  distrito: string;
  localidade: string;
  morada: string;
  coordenadas?: { latitude: number; longitude: number };
  especialidades: EspecialidadeOficina[];
  logoUrl?: string;
  fotos?: string[];
  status: StatusAnuncio;
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  dataCriacao?: Timestamp;
}
