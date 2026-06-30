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
  videoUrl?: string;
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
  videoUrl?: string;
  fotos?: string[];
  status: StatusAnuncio;
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  dataCriacao?: Timestamp;
}
