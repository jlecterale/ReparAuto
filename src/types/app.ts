import type { ReactNode } from 'react';
import type { AuthContextValue, PremiumConfig } from './usuario';
import type { FavoritosContextValue } from './favoritos';
import type { Carro, FiltroAtivo, SortOrdem } from './carro';
import type { Peca, FiltroTipoPeca } from './peca';
import type { ChatContextValue } from './chat';
import type { IntencaoContextValue } from './intencao';
import type { OficinaMecanico } from './oficina';

export interface CarrosContextValue {
  carros: Carro[];
  carrosFiltrados: Carro[];
  loading: boolean;
  filtroAtivo: FiltroAtivo;
  setFiltroAtivo: (v: FiltroAtivo) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  advPriceMin: number | null;
  setAdvPriceMin: (v: number | null) => void;
  advPriceMax: number | null;
  setAdvPriceMax: (v: number | null) => void;
  advDistrito: string;
  setAdvDistrito: (v: string) => void;
  advConcelho: string;
  setAdvConcelho: (v: string) => void;
  advRaioCentro: string;
  setAdvRaioCentro: (v: string) => void;
  advRaioKm: number | null;
  setAdvRaioKm: (v: number | null) => void;
  advBodyType: string;
  setAdvBodyType: (v: string) => void;
  advCondition: string;
  setAdvCondition: (v: string) => void;
  advCombustivel: string;
  setAdvCombustivel: (v: string) => void;
  advCambio: string;
  setAdvCambio: (v: string) => void;
  advSeatsMin: number | null;
  setAdvSeatsMin: (v: number | null) => void;
  advTraction: string;
  setAdvTraction: (v: string) => void;
  advFeatures: string[];
  setAdvFeatures: (v: string[]) => void;
  sortOrdem: SortOrdem;
  setSortOrdem: (v: SortOrdem) => void;
  publicarCarro: (dados: any) => Promise<any>;
  eliminarCarro: (id: string) => Promise<void>;
  getCarroPorId: (id: string) => Carro | null;
}

export interface PecasContextValue {
  pecas: Peca[];
  pecasFiltradas: Peca[];
  loading: boolean;
  filtroTipo: FiltroTipoPeca;
  setFiltroTipo: (v: FiltroTipoPeca) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filtroCategoria: string;
  setFiltroCategoria: (v: string) => void;
  filtroEstado: string;
  setFiltroEstado: (v: string) => void;
  advDistrito: string;
  setAdvDistrito: (v: string) => void;
  advConcelho: string;
  setAdvConcelho: (v: string) => void;
  advRaioCentro: string;
  setAdvRaioCentro: (v: string) => void;
  advRaioKm: number | null;
  setAdvRaioKm: (v: number | null) => void;
  publicarPeca: (dados: any) => Promise<any>;
  eliminarPeca: (id: string) => Promise<void>;
  getPecaPorId: (id: string) => Peca | null;
}

export interface OficinasContextValue {
  oficinas: OficinaMecanico[];
  loading: boolean;
}

export interface OpenLoginOptions {
  /** Which tab the modal opens on. Onboarding drives signups → 'registar'. */
  modoInicial?: 'login' | 'registar';
  /** Optional line explaining why the account is needed (shown atop the modal). */
  contexto?: string;
  /** Onboarding creation flow to resume once the account is ready. */
  intent?: string;
}

export interface LoginModalContextValue {
  isOpen: boolean;
  openLoginModal: (redirectTo?: string, options?: OpenLoginOptions) => void;
  closeLoginModal: () => void;
}

export interface AppContextValue {
  auth: AuthContextValue;
  carros: CarrosContextValue;
  pecas: PecasContextValue;
  favoritos: FavoritosContextValue;
  oficinas: OficinasContextValue;
  chat: ChatContextValue;
  intencoes: IntencaoContextValue;
  loginModal: LoginModalContextValue;
  premiumConfig: PremiumConfig;
}

export interface AppProviderProps {
  children: ReactNode;
}
