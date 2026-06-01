import type { ReactNode } from 'react';
import type { AuthContextValue } from './usuario';
import type { FavoritosContextValue } from './favoritos';
import type { Carro, FiltroAtivo, SortOrdem } from './carro';
import type { Peca, FiltroTipoPeca } from './peca';
import type { ChatContextValue } from './chat';
import type { IntencaoContextValue } from './intencao';

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
  sortOrdem: SortOrdem;
  setSortOrdem: (v: SortOrdem) => void;
  publicarCarro: (dados: any) => Promise<any>;
  eliminarCarro: (id: string) => Promise<void>;
  getCarroPorId: (id: string) => Carro | null;
  recarregar: () => Promise<void>;
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
  recarregar: () => Promise<void>;
}

export interface LoginModalContextValue {
  isOpen: boolean;
  openLoginModal: (redirectTo?: string) => void;
  closeLoginModal: () => void;
}

export interface AppContextValue {
  dbReady: boolean;
  auth: AuthContextValue;
  carros: CarrosContextValue;
  pecas: PecasContextValue;
  favoritos: FavoritosContextValue;
  chat: ChatContextValue;
  intencoes: IntencaoContextValue;
  loginModal: LoginModalContextValue;
}

export interface AppProviderProps {
  children: ReactNode;
}
