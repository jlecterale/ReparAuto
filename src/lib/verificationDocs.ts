import type { Country } from '@/lib/country';
import type { TipoDocumento, TipoVerificacao } from '@/types/verification';

// Human labels for every accepted document, shared by the request form and the
// admin review queue so a new market's documents render correctly in both.
export const DOCUMENTO_LABELS: Record<TipoDocumento, string> = {
  cc: 'Cartão de Cidadão',
  passaporte: 'Passaporte',
  residencia: 'Título de Residência',
  rg: 'RG (Carteira de Identidade)',
  cnh: 'CNH (Carteira de Habilitação)',
  cnpj: 'Cartão CNPJ',
  contrato_social: 'Contrato Social',
};

// Which documents each market accepts, split by verification type. Personal
// (identidade) asks for a photo ID; professional (profissional) asks for the
// business registration of the stand/oficina. BR mirrors what OLX, Mercado
// Livre and Webmotors accept (RG/CNH for people; CNPJ/contrato social for
// companies); PT keeps the Cartão de Cidadão / passaporte / título de residência.
const CATALOG: Record<Country, Record<TipoVerificacao, TipoDocumento[]>> = {
  PT: {
    identidade: ['cc', 'passaporte', 'residencia'],
    profissional: ['cc', 'passaporte', 'residencia'],
  },
  BR: {
    identidade: ['cnh', 'rg', 'passaporte'],
    profissional: ['cnpj', 'contrato_social'],
  },
};

export function documentosPermitidos(
  country: Country,
  tipo: TipoVerificacao,
): { value: TipoDocumento; label: string }[] {
  return CATALOG[country][tipo].map((value) => ({ value, label: DOCUMENTO_LABELS[value] }));
}
