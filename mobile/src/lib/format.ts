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
