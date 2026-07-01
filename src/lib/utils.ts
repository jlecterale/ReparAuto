import { COUNTRY_INFO, type Country } from '@/lib/country';

// Formats a listing price in the currency of the listing's own market —
// pass the doc's resolved country (docCountry), not the viewer's.
export function formatarPreco(valor: number | string | null | undefined, country: Country = 'PT'): string {
  const { locale } = COUNTRY_INFO[country];
  const value = valor == null || isNaN(Number(valor)) ? 0 : Number(valor);
  const formatted = value.toLocaleString(locale);
  return country === 'BR' ? `R$ ${formatted}` : `${formatted} €`;
}

export function gerarId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefone(tel: string, country: Country = 'PT'): boolean {
  const digits = tel.replace(/[\s().-]/g, '');
  if (country === 'BR') {
    // DDD (two digits, no leading zero) + mobile (9xxxxxxxx) or landline (2-5 + 7 digits).
    return /^[1-9][0-9](9\d{8}|[2-5]\d{7})$/.test(digits);
  }
  return /^(9|2)\d{8}$/.test(digits);
}

export function validarCodigoPostal(cp: string, country: Country = 'PT'): boolean {
  if (country === 'BR') return /^\d{5}-?\d{3}$/.test(cp.trim());
  return /^\d{4}-\d{3}$/.test(cp.trim());
}

export function formatarCodigoPostal(cp: string, country: Country = 'PT'): string {
  const digits = cp.replace(/\D/g, '');
  const prefixLength = country === 'BR' ? 5 : 4;
  if (digits.length <= prefixLength) return digits;
  return `${digits.slice(0, prefixLength)}-${digits.slice(prefixLength, prefixLength + 3)}`;
}

// Weighted check-digit calculation shared by CPF and CNPJ: multiply each digit
// by its weight, and the check digit is 0 when the remainder mod 11 is < 2,
// otherwise 11 - remainder.
function checkDigitMod11(digits: string, weights: number[]): number {
  const sum = weights.reduce((acc, weight, i) => acc + parseInt(digits[i], 10) * weight, 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function validarCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const d1 = checkDigitMod11(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigitMod11(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === parseInt(digits[9], 10) && d2 === parseInt(digits[10], 10);
}

function validarCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const d1 = checkDigitMod11(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = checkDigitMod11(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === parseInt(digits[12], 10) && d2 === parseInt(digits[13], 10);
}

// PT: 9-digit NIF. BR: accepts CPF (11 digits) or CNPJ (14 digits), with or
// without the usual punctuation.
export function validarNif(nif: string, country: Country = 'PT'): boolean {
  if (country === 'BR') {
    const digits = nif.replace(/[\s./-]/g, '');
    return digits.length === 14 ? validarCnpj(digits) : validarCpf(digits);
  }
  const digits = nif.replace(/\s/g, '');
  if (!/^\d{9}$/.test(digits)) return false;
  const first = parseInt(digits[0], 10);
  if (![1, 2, 3, 5, 6, 7, 8, 9].includes(first)) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(digits[i], 10) * (9 - i);
  }
  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? 0 : 11 - remainder;
  return checkDigit === parseInt(digits[8], 10);
}

export function renderDescricao(texto: string): string {
  if (!texto) return '';

  let escaped = texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  const lines = escaped.split('\n');
  let inList = false;
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        result.push('<ul class="list-disc pl-5 my-2 space-y-1">');
        inList = true;
      }
      result.push(`<li>${trimmed.substring(2)}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    }
  }
  if (inList) {
    result.push('</ul>');
  }

  return result.join('<br>').replace(/<\/ul><br>/g, '</ul>').replace(/<br><ul/g, '<ul');
}

type FotoRenderResult =
  | { type: 'img'; src: string; classes: string }
  | { type: 'emoji'; emoji: string };

export function renderFoto(foto: string, classes = 'w-full h-full object-cover'): FotoRenderResult {
  if (
    foto &&
    (foto.startsWith('data:image/') ||
      foto.startsWith('blob:') ||
      foto.startsWith('https://') ||
      foto.startsWith('http://') ||
      foto.endsWith('.png') ||
      foto.endsWith('.jpg') ||
      foto.endsWith('.jpeg') ||
      foto.includes('images/'))
  ) {
    let src = foto;
    if (src.startsWith('http://')) {
      src = 'https://' + src.slice('http://'.length);
    } else if (!src.startsWith('https://') && !src.startsWith('data:') && !src.startsWith('blob:') && !src.startsWith('/')) {
      src = '/' + src;
    }
    return { type: 'img', src, classes };
  }
  const emoji = foto || '🚗';
  return { type: 'emoji', emoji };
}

// Extracts the YouTube video id from the common URL forms (watch, youtu.be,
// embed, shorts, live) and returns a privacy-friendly nocookie embed URL.
// Returns null when the input is empty or not a recognizable YouTube link.
export function getYoutubeEmbedUrl(url: string | null | undefined): string | null {
  const id = getYoutubeId(url);
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidYoutubeUrl(url: string | null | undefined): boolean {
  return getYoutubeId(url) !== null;
}

// Registration password policy: at least 8 chars, one uppercase letter, one
// digit and one symbol. The single source of truth for the rules so the submit
// check, the live requirements checklist and the disabled-button state never
// drift apart. `label` feeds the checklist; `message` is the submit error.
export interface PasswordRule {
  label: string;
  message: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    label: 'Mínimo 8 caracteres',
    message: 'A palavra-passe deve ter pelo menos 8 caracteres.',
    test: (p) => p.length >= 8,
  },
  {
    label: 'Uma letra maiúscula',
    message: 'A palavra-passe deve conter pelo menos uma letra maiúscula.',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    label: 'Um número',
    message: 'A palavra-passe deve conter pelo menos um número.',
    test: (p) => /\d/.test(p),
  },
  {
    label: 'Um símbolo (!@#$...)',
    message: 'A palavra-passe deve conter pelo menos um símbolo.',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

// Returns the first failing rule's user-facing message, or null when the
// password satisfies every rule. Order is fixed so the message is deterministic.
export function validatePassword(password: string): string | null {
  const failing = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failing ? failing.message : null;
}

export function dataAtualISO(): string {
  return new Date().toISOString();
}

export function obterWhatsApp(whatsapp?: string | null, telefone?: string | null, country: Country = 'PT'): string | null {
  if (whatsapp && whatsapp.trim()) return whatsapp.trim();
  if (!telefone) return null;
  const digits = telefone.replace(/[\s().+-]/g, '');
  if (country === 'BR') {
    // Only mobiles (DDD + 9xxxxxxxx) receive WhatsApp links.
    if (/^[1-9][0-9]9\d{8}$/.test(digits)) return '55' + digits;
    if (/^55[1-9][0-9]9\d{8}$/.test(digits)) return digits;
    return null;
  }
  if (/^9\d{8}$/.test(digits)) return '351' + digits;
  if (/^3519\d{8}$/.test(digits)) return digits;
  return null;
}

export function gerarLinkWhatsApp(numero: string, tituloAnuncio: string): string {
  const msg = encodeURIComponent(`Olá, tenho interesse no anúncio: ${tituloAnuncio}`);
  return `https://wa.me/${numero}?text=${msg}`;
}

export function formatarData(data: { toDate?: () => Date; seconds?: number } | string | Date | null | undefined): string {
  if (!data) return '—';
  if (typeof data === 'string') return new Date(data).toLocaleDateString('pt-PT');
  if (data instanceof Date) return data.toLocaleDateString('pt-PT');
  if (typeof data.toDate === 'function') return data.toDate().toLocaleDateString('pt-PT');
  if (typeof data.seconds === 'number') return new Date(data.seconds * 1000).toLocaleDateString('pt-PT');
  return '—';
}

export function formatarDataHora(data: { toDate?: () => Date; seconds?: number } | string | Date | null | undefined): string {
  if (!data) return '—';
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  if (typeof data === 'string') return new Date(data).toLocaleDateString('pt-PT', opts);
  if (data instanceof Date) return data.toLocaleDateString('pt-PT', opts);
  if (typeof data.toDate === 'function') return data.toDate().toLocaleDateString('pt-PT', opts);
  if (typeof data.seconds === 'number') return new Date(data.seconds * 1000).toLocaleDateString('pt-PT', opts);
  return '—';
}

export function gerarTituloIntencao(dados: {
  categoria?: string;
  criterios?: { marca?: string; modelo?: string; precoMaximo?: number };
  descricao?: string;
}, country: Country = 'PT'): string {
  const cat = dados.categoria || 'carro';
  const prefixos: Record<string, string> = {
    carro: 'Procuro carro',
    moto: 'Procuro moto',
    viatura_comercial: 'Procuro viatura comercial',
    pecas: 'Procuro peça',
  };
  const prefixo = prefixos[cat] || 'Procuro';
  if (cat === 'pecas') {
    const txt = dados.descricao?.trim() ? `: ${dados.descricao.trim().slice(0, 60)}` : '';
    return `${prefixo}${txt}`;
  }
  const m = dados.criterios?.marca || '';
  const mo = dados.criterios?.modelo || '';
  const maxPrice = dados.criterios?.precoMaximo;
  const p = maxPrice ? ` até ${country === 'BR' ? `R$ ${maxPrice}` : `${maxPrice}€`}` : '';
  return `${prefixo}: ${m} ${mo}${p}`;
}

export function validarIntencaoCompra(dados: Record<string, any>): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  const c = dados.criterios;
  const cat = dados.categoria;

  if (!cat) erros.push('Categoria é obrigatória');

  if (cat === 'pecas') {
    if (!dados.descricao?.trim()) erros.push('Descrição da peça é obrigatória');
  } else {
    if (!c?.marca) erros.push('Marca é obrigatória');
    if (!c?.modelo) erros.push('Modelo é obrigatório');
    if (!c?.anoMinimo) erros.push('Ano mínimo é obrigatório');
    if (c?.anoMinimo && c?.anoMaximo) {
      if (c.anoMinimo > c.anoMaximo) erros.push('Ano mínimo não pode ser maior que o máximo');
      if (c.anoMinimo < 1990) erros.push('Ano mínimo deve ser 1990 ou depois');
      if (c.anoMaximo > new Date().getFullYear()) erros.push('Ano máximo não pode ser no futuro');
    }
  }

  if (!c?.precoMaximo) erros.push('Orçamento máximo é obrigatório');
  if (c?.precoMinimo && c?.precoMaximo) {
    if (c.precoMinimo > c.precoMaximo) erros.push('Preço mínimo não pode ser maior que o máximo');
    if (c.precoMaximo <= 0) erros.push('Orçamento máximo deve ser maior que 0');
  }

  if (cat !== 'pecas') {
    if (c?.quilometragemMaxima != null && c.quilometragemMaxima < 0) erros.push('Quilometragem deve ser maior ou igual a 0');
    if (!c?.combustivel || c.combustivel.length === 0) erros.push('Selecione ao menos um tipo de combustível');
    if (!c?.tipoTransmissao || c.tipoTransmissao.length === 0) erros.push('Selecione ao menos um tipo de transmissão');
  }

  if (!c?.localizacao?.distrito) erros.push('Distrito é obrigatório');
  if (c?.localizacao?.distrito !== 'todo_portugal' && c?.localizacao?.raio === undefined) erros.push('Raio de busca é obrigatório');
  if (!dados.contatoPreferido) erros.push('Selecione forma de contacto preferida');
  if (dados.descricao && dados.descricao.length > 500) erros.push('Descrição não pode ter mais de 500 caracteres');

  return { valido: erros.length === 0, erros };
}
