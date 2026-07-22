/** Shared UI vocabulary for the Standvirtual / Webmotors import screens. */

import type { CarroFormData } from '@/types/carro';
import type { Country } from '@/lib/country';
import { term } from '@/lib/terms';

/** Labels for form fields reported as "needs review" by the mapper. */
export function getFieldLabels(country: Country): Partial<Record<keyof CarroFormData, string>> {
  return {
    marca: 'Marca',
    modelo: 'Modelo',
    anoFabricacao: 'Ano',
    km: term('mileageLabel', country),
    preco: 'Preço',
    combustivel: 'Combustível',
    cambio: 'Câmbio',
    bodyType: 'Categoria',
    cor: 'Cor',
    traction: 'Tração',
    condition: 'Condição',
    localizacao: 'Localização',
    descricao: 'Descrição',
  };
}

export function describeUnmappedFields(fields: string[], country: Country): string {
  const labels = getFieldLabels(country);
  return fields
    .map((field) => labels[field as keyof CarroFormData] ?? field)
    .join(', ');
}
