import type { ReactNode } from 'react';
import type { AuthContextValue } from './usuario';
import type { FavoritosContextValue } from './favoritos';
import type { Carro, FiltroAtivo, SortOrdem } from './carro';
import type { Peca, FiltroTipoPeca } from './peca';

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
  advLocation: string;
  setAdvLocation: (v: string) => void;
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
  publicarPeca: (dados: any) => Promise<any>;
  eliminarPeca: (id: string) => Promise<void>;
  getPecaPorId: (id: string) => Peca | null;
  recarregar: () => Promise<void>;
}

export interface AppContextValue {
  dbReady: boolean;
  auth: AuthContextValue;
  carros: CarrosContextValue;
  pecas: PecasContextValue;
  favoritos: FavoritosContextValue;
}

export interface AppProviderProps {
  children: ReactNode;
}
