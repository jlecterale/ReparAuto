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
