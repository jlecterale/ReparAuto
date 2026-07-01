import type { Timestamp } from 'firebase/firestore';

export type EstadoVeiculo = 'pronto' | 'manutencao';
export type Combustivel = 'Gasolina' | 'Etanol' | 'Flex' | 'Diesel' | 'Elétrico' | 'Híbrido';
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
export type FiltroAtivo = 'lowcost' | '500' | '1000' | 'reparar' | 'qualquer' | null;
export type SortOrdem = 'crescente' | 'decrescente' | null;
export type FiltroChip = { label: string; value: string };
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
  manutencaoOutro?: string;
  temOrcamento?: boolean;
  orcamentoTexto?: string;
  incluirMecanicoNome?: boolean;
  mecanicoNome?: string;
  incluirMecanicoTelefone?: boolean;
  mecanicoTelefone?: string;
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
  impulso?: {
    ativo: boolean;
    dataInicio?: Timestamp;
    dataFim?: Timestamp;
  };
  visualizacoes?: number;
  contagemMensagens?: number;
  contagemFavoritos?: number;
  priceIndicator?: 'excelente' | 'bom' | 'justo' | 'acima' | 'sobrevalorizado' | 'indisponivel';
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
  bodyType: string;
  seats: string;
  condition: string;
  power: string;
  displacement: string;
  traction: string;
  features: string[];
  localizacao: string;
  localizacaoDistrito: string;
  preco: string;
  descricao: string;
  videoUrl: string;
  estadoVeiculo: EstadoVeiculo;
  rodando: string;
  inspecao: string;
  tiposManutencao: string[];
  orcamentoTexto: string;
  incluirMecanicoNome: boolean;
  incluirMecanicoTelefone: boolean;
  mecanicoNome: string;
  mecanicoTelefone: string;
  vendedorWhatsApp: string;
  vendedorTelefone: string;
  vendedorEmail: string;
}
