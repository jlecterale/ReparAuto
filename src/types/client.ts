import type { Timestamp } from 'firebase/firestore';

export type ClientStage = 'lead' | 'ativo' | 'inativo';
export type ClientSource = 'manual' | 'csv' | 'recargarage_lead';

export interface ClientVehicle {
  marca: string;
  modelo: string;
  ano?: number;
  matricula?: string;
  km?: number;
  notas?: string;
}

export interface ClientInteraction {
  id: string;
  data: Timestamp;
  tipo: 'servico' | 'contacto' | 'nota';
  descricao: string;
  valor?: number;
}

/**
 * A client record owned by a professional (the data controller). Clients are
 * the professional's own contacts and do not need a RecarGarage account; the
 * app never cross-references them against platform users.
 */
export interface Client {
  id: string;
  ownerUid: string;
  nome: string;
  email?: string;
  telefone?: string;
  morada?: string;
  distrito?: string;
  veiculos?: ClientVehicle[];
  estado: ClientStage;
  origem: ClientSource;
  tags?: string[];
  notas?: string;
  interacoes?: ClientInteraction[];
  consentimento?: boolean;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export type ClientInput = Omit<Client, 'id' | 'ownerUid' | 'criadoEm' | 'atualizadoEm'>;

export const CLIENT_STAGE_LABELS: Record<ClientStage, string> = {
  lead: 'Lead',
  ativo: 'Cliente ativo',
  inativo: 'Inativo',
};

export const CLIENT_SOURCE_LABELS: Record<ClientSource, string> = {
  manual: 'Manual',
  csv: 'Importação CSV',
  recargarage_lead: 'Lead RecarGarage',
};
