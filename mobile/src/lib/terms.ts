import type { Country } from '@/lib/country';

// Market-specific vocabulary (plan 20). Not a full i18n system: both markets
// speak Portuguese, so only the terms that differ between PT-PT and PT-BR live
// here. UI copy that is identical in both variants stays inline in components.
// Kept in sync with the web `src/lib/terms.ts`.
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
  taxIdPlaceholder: { PT: '123456789', BR: '000.000.000-00' },
  taxIdInvalid: {
    PT: 'Indique um NIF válido (9 dígitos).',
    BR: 'Informe um CPF ou CNPJ válido.',
  },
  emailPlaceholder: { PT: 'o.seu@email.pt', BR: 'seu@email.com.br' },
  workshopEmailPlaceholder: { PT: 'geral@oficina.pt', BR: 'contato@oficina.com.br' },
  addressLabel: { PT: 'Morada', BR: 'Endereço' },
  addressPlaceholder: { PT: 'Rua, número, andar…', BR: 'Rua, número…' },
  districtLabel: { PT: 'Distrito', BR: 'Estado' },
  districtAndMunicipality: { PT: 'Distrito e Concelho', BR: 'Estado e Cidade' },
  districtAllOption: { PT: 'Todos os distritos', BR: 'Todos os estados' },
  districtSelectOption: { PT: 'Selecione um distrito', BR: 'Selecione um estado' },
  municipalityLabel: { PT: 'Concelho', BR: 'Cidade' },
  municipalityAllOption: { PT: 'Todos os concelhos', BR: 'Todas as cidades' },
  plateLabel: { PT: 'Matrícula', BR: 'Placa' },
  firstRegistrationLabel: { PT: 'Mês da 1ª matrícula', BR: 'Mês do 1º emplacamento' },
  mileageLabel: { PT: 'Quilómetros', BR: 'Quilometragem' },
  gearboxLabel: { PT: 'Caixa', BR: 'Câmbio' },
  gearsLabel: { PT: 'Mudanças', BR: 'Marchas' },
  upholsteryLabel: { PT: 'Estofos', BR: 'Estofamento' },
  userFallbackName: { PT: 'Utilizador', BR: 'Usuário' },
  exchangeLabel: { PT: 'Aceita retoma', BR: 'Aceita troca' },
  passwordLabel: { PT: 'Palavra-passe', BR: 'Senha' },
  passwordNoun: { PT: 'palavra-passe', BR: 'senha' },
  forgotPasswordLink: { PT: 'Esqueceu-se da palavra-passe?', BR: 'Esqueceu a senha?' },
} satisfies Record<string, Record<Country, string>>;

export type TermKey = keyof typeof TERMS;

export function term(key: TermKey, country: Country): string {
  return TERMS[key][country];
}
