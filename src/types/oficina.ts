import type { Timestamp } from 'firebase/firestore';

export type EspecialidadeOficina =
  | 'mecanica_convencional'
  | 'preparacao'
  | 'pintura'
  | 'eletrica'
  | 'eletronica'
  | 'estetica_automotiva'
  | 'pneus'
  | 'ar_condicionado'
  | 'classicos_restauro'
  | 'outro';

export const ESPECIALIDADES_LABELS: Record<EspecialidadeOficina, string> = {
  mecanica_convencional: 'Mecânica Convencional',
  preparacao: 'Preparação & Tuning',
  pintura: 'Pintura & Funilaria',
  eletrica: 'Eletricidade',
  eletronica: 'Eletrónica & Diagnóstico',
  estetica_automotiva: 'Estética Automóvel (Detailing)',
  pneus: 'Pneus & Alinhamento',
  ar_condicionado: 'Ar Condicionado',
  classicos_restauro: 'Clássicos & Restauro',
  outro: 'Outro Serviço',
};

export interface OficinaMecanico {
  id: string;
  criador: string; // Email do criador da oficina
  criadorUid?: string;
  nome: string;
  descricao: string;
  responsavel: string;
  telefone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  distrito: string;
  localidade: string;
  morada: string;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  especialidades: EspecialidadeOficina[];
  logoUrl?: string;
  videoUrl?: string;
  fotos?: string[];
  status: 'pendente' | 'aprovado' | 'rejeitado';
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  contagemFavoritos?: number;
  dataCriacao?: Timestamp;
}

export type OficinaInput = Omit<OficinaMecanico, 'id' | 'status' | 'dataCriacao'>;
