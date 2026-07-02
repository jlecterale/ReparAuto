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
  /** Firebase Auth email verification state (not persisted in Firestore). */
  emailVerified?: boolean;
  verificado?: boolean;
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  badges?: string[];
  /** Per-group × per-channel notification preferences — shared with web. */
  notifPrefs?: NotificationPreferences;
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
export type BodyType =
  | 'Citadino'
  | 'Utilitário'
  | 'Sedan'
  | 'Carrinha'
  | 'SUV'
  | 'Monovolume'
  | 'Coupé'
  | 'Cabrio'
  | 'Pick-up';
export type Condition = 'Novo' | 'Usado' | 'Para peças';
export type Traction = 'Dianteira' | 'Traseira' | 'Integral (4x4)';
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
  bodyType?: BodyType;
  seats?: number;
  condition?: Condition;
  power?: number;
  displacement?: number;
  traction?: Traction;
  features?: string[];
  local: string;
  distrito?: string;
  coordenadas?: { lat: number; lng: number };
  descricao: string;
  videoUrl?: string;
  estadoVeiculo: EstadoVeiculo;
  tiposManutencao: string[];
  fotos: string[];
  /** Vehicle angle → index into `fotos`; enables the 360 spin viewer (see src/lib/spin360.ts). */
  photoAngles?: Record<string, number> | null;
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

// ---------- Marcas & modelos (source of truth: Firestore `marcas_modelos`) ----------
export type TipoVeiculo = 'carro' | 'moto' | 'caminhao';

/** Document in the `marcas_modelos` collection — `nome` is the document ID. */
export interface MarcaModeloDoc {
  nome: string;
  tipos: TipoVeiculo[];
  modelos: string[];
  ativo: boolean;
  ordem?: number;
}

// ---------- Intenções de compra ----------
export type CategoriaIntencao = 'carro' | 'moto' | 'viatura_comercial' | 'pecas';
export type StatusIntencao = 'pendente' | 'ativa' | 'pausada' | 'expirada' | 'deletada';
export type ContatoPreferido = 'chat' | 'whatsapp' | 'ambos';

export const CATEGORIA_INTENCAO_LABELS: Record<CategoriaIntencao, string> = {
  carro: 'Carro',
  moto: 'Mota',
  viatura_comercial: 'Comercial',
  pecas: 'Peças',
};

export interface IntencaoCriterios {
  marca: string;
  modelo: string;
  anoMinimo: number;
  anoMaximo?: number;
  precoMinimo?: number;
  precoMaximo: number;
  combustivel: string[];
  tipoTransmissao: string[];
  quilometragemMaxima: number;
  localizacao: { distrito: string; raio: number; latitude?: number; longitude?: number };
}

export interface IntencaoCompra {
  id: string;
  userId: string;
  categoria: CategoriaIntencao;
  titulo: string;
  descricao?: string;
  criterios: IntencaoCriterios;
  contatoPreferido: ContatoPreferido;
  mostrarTelefone: boolean;
  vendedorNome?: string;
  vendedorTelefone?: string;
  vendedorWhatsApp?: string;
  vendedorEmail?: string;
  status: StatusIntencao;
  prioritaria: boolean;
  stats: { visualizacoes: number; visualizacoes7Dias: number; contatos: number; contatos7Dias: number };
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
}

// ---------- Confiança: reviews & reports ----------
export type StatusReview = 'pendente' | 'aprovado' | 'rejeitado';

export interface Review {
  id: string;
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca' | 'oficina';
  nota: number;
  comentario: string;
  status: StatusReview;
  dataCriacao: Timestamp;
}

export type MotivoReport =
  | 'fraude'
  | 'informacao_falsa'
  | 'conteudo_ofensivo'
  | 'spam'
  | 'veiculo_roubado'
  | 'outro';
export type TipoReport = 'carro' | 'peca' | 'utilizador';
export type StatusReport = 'pendente' | 'em_analise' | 'resolvido' | 'rejeitado';

export const MOTIVO_REPORT_LABELS: Record<MotivoReport, string> = {
  fraude: 'Fraude / burla',
  informacao_falsa: 'Informação falsa',
  conteudo_ofensivo: 'Conteúdo ofensivo',
  spam: 'Spam',
  veiculo_roubado: 'Veículo roubado',
  outro: 'Outro',
};

export interface Report {
  id: string;
  denuncianteUid: string;
  denuncianteEmail: string;
  alvoId: string;
  alvoTipo: TipoReport;
  motivo: MotivoReport;
  descricao: string;
  status: StatusReport;
  dataCriacao: Timestamp;
  dataResolucao?: Timestamp;
  resolvidoPor?: string;
  notasAdmin?: string;
}

// ---------- Verificações ----------
export type StatusVerificacao = 'pendente' | 'aprovado' | 'rejeitado';
export type TipoVerificacao = 'identidade' | 'profissional';
export type TipoDocumento = 'cc' | 'passaporte' | 'residencia';

export const TIPO_DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  cc: 'Cartão de Cidadão',
  passaporte: 'Passaporte',
  residencia: 'Autorização de Residência',
};

export interface Verification {
  id: string;
  uid: string;
  email: string;
  nome: string;
  tipo: TipoVerificacao;
  tipoDocumento: TipoDocumento;
  documentoUrl: string;
  selfieUrl: string;
  nif?: string;
  status: StatusVerificacao;
  dataPedido: Timestamp;
  dataResolucao?: Timestamp;
  resolvidoPor?: string;
  notasAdmin?: string;
}

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
export type TipoNotificacao = 'aprovado' | 'rejeitado' | 'info' | 'mensagem' | 'alerta' | 'preco';

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

// ---------- Alertas (mirrors web src/types/alertas.ts + busca.ts) ----------
export type TipoAlerta = 'filtro_salvo' | 'palavra_chave' | 'criterio';
export type CategoriaAlerta = 'carros' | 'pecas' | 'oficinas';

/**
 * Subset of the web's SearchFilters that the mobile filter sheet
 * (useCarFilters/CarAdvFilters) can actually produce. Field names match the
 * web's SearchFilters verbatim — the Cloud Function matcher
 * (functions/src/lib/matching.ts) reads this shape regardless of platform.
 */
export interface AlertFiltros {
  texto?: string;
  marca?: string;
  modelo?: string;
  combustivel?: Combustivel;
  distrito?: string;
  concelho?: string;
  precoMin?: number;
  precoMax?: number;
  anoMin?: number;
  anoMax?: number;
  kmMin?: number;
  kmMax?: number;
  estadoVeiculo?: EstadoVeiculo;
}

export interface AlertCriteria {
  categoria: CategoriaAlerta;
  tipoAnuncio?: string;
  concelho?: string;
  distrito?: string;
  marca?: string;
}

interface AlertSubscriptionBase {
  id: string;
  uid: string;
  nome: string;
  ativo: boolean;
  novosResultados: number;
  dataCriacao: Timestamp;
  ultimaNotificacao?: Timestamp;
}

export interface KeywordAlertSubscription extends AlertSubscriptionBase {
  tipo: 'palavra_chave';
  keyword: string;
  categoria?: CategoriaAlerta;
}

export interface CriteriaAlertSubscription extends AlertSubscriptionBase {
  tipo: 'criterio';
  criteria: AlertCriteria;
}

export interface SavedFilterAlertSubscription extends AlertSubscriptionBase {
  tipo: 'filtro_salvo';
  filters: AlertFiltros;
}

export type AlertSubscription =
  | KeywordAlertSubscription
  | CriteriaAlertSubscription
  | SavedFilterAlertSubscription;

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type AlertSubscriptionInput = DistributiveOmit<
  AlertSubscription,
  'id' | 'uid' | 'novosResultados' | 'dataCriacao' | 'ultimaNotificacao'
>;

/** Only the two groups mobile has a UI for today (alerta/preco) — mensagem
 * and conta keep the single blanket `Usuario.notificacoes` switch for now. */
export interface ChannelPreferences {
  inApp: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  mensagem: ChannelPreferences;
  conta: ChannelPreferences;
  alerta: ChannelPreferences;
  preco: ChannelPreferences;
}

export type GrupoPreferencia = keyof NotificationPreferences;

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
  videoUrl?: string;
  fotos?: string[];
  status: StatusAnuncio;
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  dataCriacao?: Timestamp;
}
