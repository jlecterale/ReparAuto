import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type Role = 'user' | 'admin';
export type TipoConta = 'particular' | 'profissional';
export type CategoriaPlano = 'anuncios' | 'oficinas' | 'leads';

export interface PlanoAtivo {
  planoId: string;
  nome: string;
  categoria: CategoriaPlano;
  dataAtribuicao: Timestamp;
  dataExpiracao: Timestamp;
  atribuidoPor: 'admin' | 'stripe';
  adminUid?: string;
  adminNome?: string;
}

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
  emailVerified?: boolean;
  verificado?: boolean;
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  badges?: string[];
  planoAtivo?: PlanoAtivo;
  impulsosDisponiveis?: number;
  dataCriacao?: Timestamp;
  dataAtualizacao?: Timestamp;
}

export type FirebaseUser = User;

export interface AuthContextValue {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  registar: (nome: string, email: string, password: string) => Promise<Usuario>;
  loginGoogle: () => Promise<Usuario>;
  loginApple: () => Promise<Usuario>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isAdmin: boolean;
  profileCompleted: boolean;
  updateProfile: (data: Partial<Usuario>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  reenviarEmailVerificacao: () => Promise<void>;
}

export type UsuarioInput = Omit<Usuario, 'uid' | 'dataCriacao' | 'dataAtualizacao'>;

export interface PremiumConfig {
  masterActive: boolean;
  impulsionamento: boolean;
  oficinas: boolean;
  leads: boolean;
  parceriasActive?: boolean;
  financiamento?: boolean;
  seguro?: boolean;
  atualizadoEm?: Timestamp;
  atualizadoPor?: string;
}
