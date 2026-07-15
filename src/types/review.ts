import type { Timestamp } from 'firebase/firestore';

export type StatusReview = 'pendente' | 'aprovado' | 'rejeitado';

export interface ReviewCriterio {
  /** Machine key, e.g. 'qualidade_servico' or 'precisao_anuncio' */
  chave: string;
  /** Human-readable label in PT-PT, e.g. 'Qualidade do serviço prestado' */
  rotulo: string;
  /** Rating 1-5 */
  nota: number;
}

export interface Review {
  id: string;
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca' | 'oficina';
  /** Structured criteria ratings — replaces the flat `nota` field */
  criterios: ReviewCriterio[];
  /** legacy overall rating kept for backward compatibility (average of criterios) */
  nota: number;
  comentario: string;
  status: StatusReview;
  dataCriacao: Timestamp;
  /** Set on every edit (re-pendente) */
  dataAtualizacao?: Timestamp;
}

export type ReviewInput = {
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca' | 'oficina';
  /** If omitted, addReview auto-generates default criteria for the anuncioTipo */
  criterios?: ReviewCriterio[];
  nota: number;
  comentario: string;
};

/**
 * Helper to build a deterministic document id.
 * Guarantees one review per (autorUid, anuncioId) at the Firestore level.
 */
export function getReviewId(autorUid: string, anuncioId: string): string {
  return `${autorUid}_${anuncioId}`;
}
