export function formatarPreco(valor: number | string | null | undefined): string {
  if (valor == null || isNaN(Number(valor))) return '0 €';
  return Number(valor).toLocaleString('pt-PT') + ' €';
}

export function gerarId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefone(tel: string): boolean {
  const digits = tel.replace(/\s/g, '');
  return /^(9|2)\d{8}$/.test(digits);
}

export function validarCodigoPostal(cp: string): boolean {
  return /^\d{4}-\d{3}$/.test(cp.trim());
}

export function formatarCodigoPostal(cp: string): string {
  const digits = cp.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
}

export function validarNif(nif: string): boolean {
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

export function dataAtualISO(): string {
  return new Date().toISOString();
}

export function obterWhatsApp(whatsapp?: string | null, telefone?: string | null): string | null {
  if (whatsapp && whatsapp.trim()) return whatsapp.trim();
  if (!telefone) return null;
  const digits = telefone.replace(/\s/g, '');
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
}): string {
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
  const p = dados.criterios?.precoMaximo ? ` até ${dados.criterios.precoMaximo}€` : '';
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
