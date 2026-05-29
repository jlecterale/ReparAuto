import type { Timestamp } from 'firebase/firestore';
import type { StatusAnuncio } from './carro';

export type TipoPeca = 'venda' | 'desmonte' | 'procura';
export type FiltroTipoPeca = 'todos' | TipoPeca;

export type PartCategory =
  | 'Motor e Transmissão'
  | 'Carroçaria e Chaparia'
  | 'Iluminação e Óticas'
  | 'Interior e Bancos'
  | 'Suspensão e Travões'
  | 'Eletrónica e Sensores'
  | 'Carro Completo p/ Desmonte'
  | 'Outros';

export interface CompatibilityEntry {
  marca: string;
  modelo?: string;
  anoInicio?: number;
  anoFim?: number;
  motor?: string;
}

export interface Peca {
  id: string;
  tipo: TipoPeca;
  titulo: string;
  categoria: string;
  marcaCarro: string;
  modeloCarro?: string;
  compatibilidades?: CompatibilityEntry[];
  precoNovoReferencia?: number;
  numeroOEM?: string;
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
  bulkLoteId?: string;
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
  localizacaoDistrito: string;
  vendedorTelefone: string;
  vendedorWhatsApp: string;
  vendedorEmail: string;
  compatibilidades?: CompatibilityEntry[];
}
