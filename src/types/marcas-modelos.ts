/** Tipo de veículo para classificação de marcas/modelos */
export type TipoVeiculo = 'carro' | 'moto' | 'caminhao';

/** Documento da coleção `marcas_modelos` no Firestore */
export interface MarcaModeloDoc {
  /** Nome da marca (ex: "BMW", "Yamaha") — usado como ID do documento */
  nome: string;
  /** Tipos de veículo que esta marca abrange */
  tipos: TipoVeiculo[];
  /** Lista de modelos disponíveis para esta marca */
  modelos: string[];
  /** Se a marca está ativa (para desativar sem deletar) */
  ativo: boolean;
  /** Ordem personalizada para exibição (opcional) */
  ordem?: number;
}

/** Formato do cache local no localStorage */
export interface MarcasModelosCache {
  timestamp: number;
  dados: MarcaModeloDoc[];
}
