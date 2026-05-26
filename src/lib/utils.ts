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
  return /^9\d{8}$/.test(tel.replace(/\s/g, ''));
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
