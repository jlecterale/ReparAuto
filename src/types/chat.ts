import type { Timestamp } from 'firebase/firestore';

export type ListingType = 'carro' | 'peca' | 'intencao';

export interface Mensagem {
  id: string;
  listingId: string;
  listingType: ListingType;
  listingTitle: string;
  fromUid: string;
  fromNome: string;
  toUid: string;
  toNome: string;
  participants: string[];
  mensagem: string;
  lida: boolean;
  dataCriacao: Timestamp;
}

export type MensagemInput = Omit<Mensagem, 'id' | 'dataCriacao'> & { dataCriacao?: Timestamp };

export interface ChatContextValue {
  mensagensNaoLidas: number;
  abrirChat: (listingId: string, listingType: ListingType, listingTitle: string, vendedorUid: string, vendedorNome: string) => void;
  chatAberto: boolean;
  fecharChat: () => void;
  chatListingId: string | null;
  chatListingType: ListingType | null;
  chatListingTitle: string;
  chatVendedorUid: string;
  chatVendedorNome: string;
  enviarMensagem: (texto: string) => Promise<void>;
  conversa: Mensagem[];
  carregandoConversa: boolean;
}
