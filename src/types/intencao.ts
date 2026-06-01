import type { Timestamp } from 'firebase/firestore';

export type CategoriaIntencao = 'carro' | 'moto' | 'viatura_comercial' | 'pecas';
export type StatusIntencao = 'pendente' | 'ativa' | 'pausada' | 'expirada' | 'deletada';
export type ContatoPreferido = 'chat' | 'whatsapp' | 'ambos';
export type StatusContato = 'aberto' | 'respondido' | 'aceito' | 'rejeitado' | 'finalizado';
export type StatusDenunciaIntencao = 'aberta' | 'investigando' | 'resolvida';
export type AcaoDenuncia = 'aviso' | 'suspensao' | 'remocao';
export type TipoNotificacaoIntencao = 'nova_intencao_match' | 'intencao_recebeu_contato';

export interface IntencaoCompra {
  id: string;
  userId: string;
  categoria: CategoriaIntencao;
  titulo: string;
  descricao?: string;
  criterios: {
    marca: string;
    modelo: string;
    anoMinimo: number;
    anoMaximo?: number;
    precoMinimo?: number;
    precoMaximo: number;
    combustivel: string[];
    tipoTransmissao: string[];
    quilometragemMaxima: number;
    localizacao: {
      distrito: string;
      raio: number;
      latitude?: number;
      longitude?: number;
    };
  };
  preferencias?: {
    cores?: string[];
    tipoCarroceria?: string[];
    itensDesejados?: string[];
    aceitaFinanciamento?: boolean;
    aceitaTroca?: boolean;
    aceitaVeiculoSegundaMao?: boolean;
  };
  contatoPreferido: ContatoPreferido;
  mostrarTelefone: boolean;
  vendedorNome?: string;
  vendedorTelefone?: string;
  vendedorWhatsApp?: string;
  vendedorEmail?: string;
  status: StatusIntencao;
  prioritaria: boolean;
  destaque?: {
    ativo: boolean;
    tipo?: 'destacada' | 'superdestacar';
    dataInicio?: Timestamp;
    dataFim?: Timestamp;
    posicao?: number;
    recorrente?: boolean;
  };
  stats: {
    visualizacoes: number;
    visualizacoes7Dias: number;
    contatos: number;
    contatos7Dias: number;
  };
  criadaEm: Timestamp;
  atualizadaEm: Timestamp;
  expiradoEm?: Timestamp;
  deletadaEm?: Timestamp;
}

export type IntencaoCompraInput = Omit<IntencaoCompra, 'id' | 'criadaEm' | 'atualizadaEm' | 'stats'>;

export interface ContatoIntencao {
  id: string;
  intencaoId: string;
  vendedorId: string;
  carroId?: string;
  titulo: string;
  descricao?: string;
  precoOferido?: number;
  status: StatusContato;
  chatId: string;
  ultimaMensagemEm?: Timestamp;
  marcadoComoRelevante: boolean;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export type ContatoIntencaoInput = Omit<ContatoIntencao, 'id' | 'criadoEm' | 'atualizadoEm'>;

export interface NotificacaoIntencao {
  id: string;
  vendedorId: string;
  intencaoId: string;
  tipo: TipoNotificacaoIntencao;
  titulo: string;
  descricao: string;
  lida: boolean;
  criadaEm: Timestamp;
}

export interface DenunciaIntencao {
  id: string;
  intencaoId: string;
  denunciantId: string;
  motivo: 'falsa' | 'spam' | 'golpe' | 'outra';
  descricao: string;
  status: StatusDenunciaIntencao;
  acaoTomada?: AcaoDenuncia;
  investigadorId?: string;
  notas?: string;
  criadaEm: Timestamp;
  resolvidaEm?: Timestamp;
}

export interface IntencaoContextValue {
  intencoes: IntencaoCompra[];
  loading: boolean;
  criarIntencao: (dados: IntencaoCompraInput) => Promise<string>;
  getIntencoesPorUsuario: (userId: string) => Promise<IntencaoCompra[]>;
  getIntencaoPorId: (id: string) => Promise<IntencaoCompra | null>;
  atualizarIntencao: (id: string, userId: string, updates: Partial<IntencaoCompra>) => Promise<void>;
  pausarIntencao: (id: string, userId: string) => Promise<void>;
  reativarIntencao: (id: string, userId: string) => Promise<void>;
  deletarIntencao: (id: string, userId: string) => Promise<void>;
  buscarIntencoesMatch: (carro: any, usuarioId: string) => Promise<IntencaoCompra[]>;
  iniciarContato: (intencaoId: string, vendedorId: string, carroId?: string, mensagem?: string) => Promise<string>;
  getContatosPorIntencao: (intencaoId: string) => Promise<import('./intencao').ContatoIntencao[]>;
}
