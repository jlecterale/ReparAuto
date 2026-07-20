import type { Timestamp } from 'firebase/firestore';
import type { Country } from '@/lib/country';

export type ServiceType = 'workshop' | 'towing' | 'tire_repair';

export interface DailySchedule {
  closed: boolean;
  openTime?: string;  // e.g., "08:30"
  closeTime?: string; // e.g., "19:00"
}

export interface WorkingHours {
  is24h: boolean;
  schedule?: {
    seg?: DailySchedule;
    ter?: DailySchedule;
    qua?: DailySchedule;
    qui?: DailySchedule;
    sex?: DailySchedule;
    sab?: DailySchedule;
    dom?: DailySchedule;
  };
  customText?: string;
}

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
  serviceType?: ServiceType; // Defaults to 'workshop' if not set
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
  /** Neighbourhood — Brazilian workshops only ("bairro"); unused for PT. */
  bairro?: string;
  morada: string;
  /** Market the workshop belongs to (missing on legacy docs = PT). */
  country?: Country;
  coordenadas?: {
    latitude: number;
    longitude: number;
  };
  especialidades: EspecialidadeOficina[];
  workingHours?: WorkingHours;
  towingDetails?: {
    capabilities: ('light' | 'heavy' | 'motorcycle' | 'classic' | 'agricultural')[];
  };
  logoUrl?: string;
  videoUrl?: string;
  fotos?: string[];
  status: 'pendente' | 'aprovado' | 'rejeitado';
  mediaAvaliacoes?: number;
  totalAvaliacoes?: number;
  contagemFavoritos?: number;
  visualizacoes?: number;
  contagemMensagens?: number;
  dataCriacao?: Timestamp;
}

export type OficinaInput = Omit<OficinaMecanico, 'id' | 'status' | 'dataCriacao'>;
