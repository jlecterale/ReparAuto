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
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
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
      foto.endsWith('.png') ||
      foto.endsWith('.jpg') ||
      foto.endsWith('.jpeg') ||
      foto.includes('images/'))
  ) {
    return { type: 'img', src: foto, classes };
  }
  const emoji = foto || '🚗';
  return { type: 'emoji', emoji };
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
