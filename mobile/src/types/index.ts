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

export type TipoPeca =
  | 'Motor'
  | 'Travões'
  | 'Suspensão'
  | 'Elétrica'
  | 'Carroçaria'
  | 'Interior'
  | 'Pneus'
  | 'Outro';

export interface Peca {
  id: string;
  titulo: string;
  tipo: TipoPeca;
  preco: number;
  estado: string;
  marca?: string;
  modelo?: string;
  local: string;
  distrito?: string;
  descricao: string;
  fotos: string[];
  criador: string;
  criadorUid?: string;
  status: StatusAnuncio;
  dataCriacao: Timestamp;
}

export interface Oficina {
  id: string;
  nome: string;
  descricao: string;
  servicos: string[];
  local: string;
  distrito?: string;
  morada?: string;
  coordenadas?: { lat: number; lng: number };
  telefone?: string;
  email?: string;
  fotos: string[];
  criador: string;
  criadorUid?: string;
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  verificado?: boolean;
  status: StatusAnuncio;
  dataCriacao: Timestamp;
}
