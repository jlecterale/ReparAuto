import type { Timestamp } from 'firebase/firestore';
import type { Country } from '@/lib/country';

export type StatusProposta = 'pendente' | 'aceita' | 'rejeitada' | 'expirada' | 'cancelada';
export type TipoAnuncio = 'carro' | 'peca' | 'servico';

export interface Proposta {
  id: string;
  anuncioId: string;
  anuncioTipo: TipoAnuncio;
  anuncioTitulo: string;
  anuncioPrecoOriginal: number;
  /** Market of the listing the proposal targets (missing on legacy docs = PT). */
  country?: Country;
  vendedorUid: string;
  vendedorNome: string;
  compradorUid: string;
  compradorNome: string;
  valor: number;
  mensagem?: string;
  status: StatusProposta;
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
  respostaCompradorEm?: Timestamp;
}

export type PropostaInput = Omit<Proposta, 'id' | 'criadaEm' | 'atualizadaEm'>;
