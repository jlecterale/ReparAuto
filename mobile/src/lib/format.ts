/** Formatters aligned with the web app (pt-PT/EUR, pt-BR/BRL). */
import { COUNTRY_INFO, type Country } from './country';

/**
 * Prices are formatted in the listing's market currency — pass the doc's
 * `docCountry(...)`, not the viewer's preference. Defaults to PT (EUR).
 */
export function formatPreco(preco: number, country: Country = 'PT'): string {
  const { locale, currency } = COUNTRY_INFO[country];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
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
export function formatPrecoOpcional(
  preco: number | null | undefined,
  country: Country = 'PT',
): string {
  return preco != null && preco > 0 ? formatPreco(preco, country) : 'Sob consulta';
}
