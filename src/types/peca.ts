import type { Timestamp } from 'firebase/firestore';

export type TipoPeca = 'venda' | 'desmonte' | 'procura';
export type FiltroTipoPeca = 'todos' | TipoPeca;

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
  contacto?: string;
  foto?: string;
  criador: string;
  vendedorNome?: string;
  descricao: string;
  dataCriacao: Timestamp;
}

export type PecaInput = Omit<Peca, 'id' | 'dataCriacao'> & { dataCriacao?: Timestamp };

export interface PecaFormData {
  tipo: TipoPeca;
  titulo: string;
  categoria: string;
  estado: string;
  marcaCarro: string;
  preco: string;
  descricao: string;
  localizacao: string;
}
