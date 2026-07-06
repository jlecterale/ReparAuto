/** Shared UI vocabulary for the Standvirtual import screens. */

import type { CarroFormData } from '@/types/carro';

/** PT labels for form fields reported as "needs review" by the mapper. */
export const FIELD_LABELS: Partial<Record<keyof CarroFormData, string>> = {
  marca: 'Marca',
  modelo: 'Modelo',
  anoFabricacao: 'Ano',
  km: 'Quilómetros',
  preco: 'Preço',
  combustivel: 'Combustível',
  cambio: 'Caixa',
  bodyType: 'Carroçaria',
  cor: 'Cor',
  traction: 'Tração',
  condition: 'Condição',
  localizacao: 'Localização',
  descricao: 'Descrição',
};

export function describeUnmappedFields(fields: string[]): string {
  return fields
    .map((field) => FIELD_LABELS[field as keyof CarroFormData] ?? field)
    .join(', ');
}
