/** Formatters aligned with the web app (pt-PT, EUR). */

export function formatPreco(preco: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(preco);
}

export function formatKm(km: number): string {
  return `${new Intl.NumberFormat('pt-PT').format(km)} km`;
}

export function formatNumero(n: number): string {
  return new Intl.NumberFormat('pt-PT').format(n);
}

/** Parts may have no price (e.g. "procura" listings) → "Sob consulta". */
export function formatPrecoOpcional(preco: number | null | undefined): string {
  return preco != null && preco > 0 ? formatPreco(preco) : 'Sob consulta';
}

/**
 * Compact chat-style timestamp (mirrors web `formatMessageTime` in
 * src/lib/utils.ts — keep both in sync): time only for today, "Ontem" for
 * yesterday, full date otherwise. Empty string while a serverTimestamp
 * write is still pending (null snapshot value). Days are compared as
 * calendar dates (not ms math) so DST transitions don't break "Ontem".
 */
export function formatMessageTime(data: { toDate?: () => Date; seconds?: number } | string | Date | null | undefined): string {
  let date: Date | null = null;
  if (typeof data === 'string') date = new Date(data);
  else if (data instanceof Date) date = data;
  else if (typeof data?.toDate === 'function') date = data.toDate();
  else if (typeof data?.seconds === 'number') date = new Date(data.seconds * 1000);
  if (!date || Number.isNaN(date.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(date, now)) return time;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameDay(date, yesterday)) return `Ontem, ${time}`;
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}, ${time}`;
}
