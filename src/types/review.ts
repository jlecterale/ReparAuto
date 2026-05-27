import type { Timestamp } from 'firebase/firestore';

export interface Review {
  id: string;
  autorUid: string;
  autorNome: string;
  autorFoto: string | null;
  vendedorUid: string;
  vendedorEmail: string;
  anuncioId: string;
  anuncioTipo: 'carro' | 'peca';
  nota: number;
  comentario: string;
  dataCriacao: Timestamp;
}

export type ReviewInput = Omit<Review, 'id' | 'dataCriacao'>;
