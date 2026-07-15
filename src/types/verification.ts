import type { Timestamp } from 'firebase/firestore';
import type { Country } from '@/lib/country';

export type StatusVerificacao = 'pendente' | 'aprovado' | 'rejeitado';
export type TipoVerificacao = 'identidade' | 'profissional';
// PT documents: cc (Cartão de Cidadão), passaporte, residencia (Título de
// Residência). BR documents: rg, cnh (personal), cnpj, contrato_social
// (professional / pessoa jurídica). See src/lib/verificationDocs.ts.
export type TipoDocumento =
  | 'cc'
  | 'passaporte'
  | 'residencia'
  | 'rg'
  | 'cnh'
  | 'cnpj'
  | 'contrato_social';

export interface Verification {
  id: string;
  uid: string;
  email: string;
  nome: string;
  /** Market the request was submitted in (missing on legacy docs = PT). */
  country?: Country;
  tipo: TipoVerificacao;
  tipoDocumento: TipoDocumento;
  documentoUrl: string;
  selfieUrl: string;
  nif?: string;
  status: StatusVerificacao;
  dataPedido: Timestamp;
  dataResolucao?: Timestamp;
  resolvidoPor?: string;
  notasAdmin?: string;
}

export type VerificationInput = Omit<Verification, 'id' | 'dataPedido' | 'dataResolucao' | 'resolvidoPor' | 'notasAdmin'>;
