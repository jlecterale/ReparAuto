import type { Timestamp } from 'firebase/firestore';

export type EstadoVeiculo = 'pronto' | 'manutencao';
export type Combustivel = 'Gasolina' | 'Etanol' | 'Flex' | 'Diesel' | 'Elétrico' | 'Híbrido';
export type Cambio = 'Manual' | 'Automático' | 'CVT';
export type FiltroAtivo = 'lowcost' | '500' | '1000' | 'reparar' | 'qualquer' | null;
export type SortOrdem = 'crescente' | 'decrescente' | null;
export type FiltroChip = { label: string; value: string };

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
  descricao: string;
  estadoVeiculo: EstadoVeiculo;
  tiposManutencao: string[];
  manutencaoOutro?: string;
  temOrcamento?: boolean;
  orcamentoTexto?: string;
  incluirMecanicoNome?: boolean;
  mecanicoNome?: string;
  incluirMecanicoTelefone?: boolean;
  mecanicoTelefone?: string;
  fotos: string[];
  criador: string;
  vendedorNome?: string;
  vendedorTelefone?: string;
  rodando?: boolean;
  inspecao?: boolean;
  dataCriacao: Timestamp;
}

export type CarroInput = Omit<Carro, 'id' | 'dataCriacao'> & { dataCriacao?: Timestamp };

export interface CarroFormData {
  marca: string;
  modelo: string;
  anoFabricacao: string;
  anoModelo: string;
  km: string;
  cor: string;
  combustivel: Combustivel;
  cambio: Cambio;
  portas: string;
  localizacao: string;
  preco: string;
  descricao: string;
  estadoVeiculo: EstadoVeiculo;
  rodando: string;
  inspecao: string;
  tiposManutencao: string[];
  orcamentoTexto: string;
  incluirMecanicoNome: boolean;
  incluirMecanicoTelefone: boolean;
  mecanicoNome: string;
  mecanicoTelefone: string;
}
