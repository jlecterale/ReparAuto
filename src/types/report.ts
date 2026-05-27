import type { Timestamp } from 'firebase/firestore';

export type MotivoReport = 'fraude' | 'informacao_falsa' | 'conteudo_ofensivo' | 'spam' | 'veiculo_roubado' | 'outro';
export type StatusReport = 'pendente' | 'em_analise' | 'resolvido' | 'rejeitado';
export type TipoReport = 'carro' | 'peca' | 'utilizador';

export interface Report {
  id: string;
  denuncianteUid: string;
  denuncianteEmail: string;
  alvoId: string;
  alvoTipo: TipoReport;
  motivo: MotivoReport;
  descricao: string;
  status: StatusReport;
  dataCriacao: Timestamp;
  dataResolucao?: Timestamp;
  resolvidoPor?: string;
  notasAdmin?: string;
}

export type ReportInput = Omit<Report, 'id' | 'dataCriacao' | 'dataResolucao' | 'resolvidoPor' | 'notasAdmin'>;
