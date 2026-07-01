import type { Country } from '@/lib/country';

// Market-specific vocabulary (plan 20). Not a full i18n system: both markets
// speak Portuguese, so only the terms that differ between PT-PT and PT-BR live
// here. UI copy that is identical in both variants stays inline in components.
const TERMS = {
  phoneLabel: { PT: 'Telemóvel', BR: 'Celular' },
  phonePlaceholder: { PT: '912 345 678', BR: '(11) 98765-4321' },
  phoneInvalid: {
    PT: 'Indique um número de telemóvel português válido.',
    BR: 'Informe um número de celular ou fixo brasileiro válido (com DDD).',
  },
  postalCodeLabel: { PT: 'Código Postal', BR: 'CEP' },
  postalCodePlaceholder: { PT: '4700-000', BR: '01310-100' },
  postalCodeInvalid: {
    PT: 'Indique um código postal válido (0000-000).',
    BR: 'Informe um CEP válido (00000-000).',
  },
  taxIdLabel: { PT: 'NIF', BR: 'CPF/CNPJ' },
  taxIdInvalid: {
    PT: 'Indique um NIF válido (9 dígitos).',
    BR: 'Informe um CPF ou CNPJ válido.',
  },
  addressLabel: { PT: 'Morada', BR: 'Endereço' },
  districtLabel: { PT: 'Distrito', BR: 'Estado' },
  municipalityLabel: { PT: 'Concelho', BR: 'Cidade' },
  plateLabel: { PT: 'Matrícula', BR: 'Placa' },
} satisfies Record<string, Record<Country, string>>;

export type TermKey = keyof typeof TERMS;

export function term(key: TermKey, country: Country): string {
  return TERMS[key][country];
}
