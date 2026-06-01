import type { Timestamp } from 'firebase/firestore';

export type StatusReview = 'pendente' | 'aprovado' | 'rejeitado';

export interface Review {
  id: string;
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca' | 'oficina';
  nota: number;
  comentario: string;
  status: StatusReview;
  dataCriacao: Timestamp;
}

export type ReviewInput = Omit<Review, 'id' | 'dataCriacao' | 'status'>;
