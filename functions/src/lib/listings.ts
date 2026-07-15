/**
 * Small shared helpers for listing-driven triggers (plan 3.1).
 * Pure — no Firebase imports.
 */
import type { ListingCollection, ListingData } from "./matching";

/** In-app route for a listing, per collection. */
export function listingLink(colecao: ListingCollection, id: string): string {
  switch (colecao) {
    case "parts":
      return `/pecas/${id}`;
    case "services":
      return `/oficinas/detalhes/${id}`;
    default:
      return `/detalhes/${id}`;
  }
}

/** Human title for a listing: "Marca Modelo" (cars), titulo (parts), nome (services). */
export function listingTitle(listing: ListingData, colecao: ListingCollection): string {
  if (colecao === "cars") {
    const nome = `${typeof listing.marca === "string" ? listing.marca : ""} ${
      typeof listing.modelo === "string" ? listing.modelo : ""
    }`.trim();
    return nome || "Anúncio";
  }
  const titulo = colecao === "parts" ? listing.titulo : listing.nome;
  return typeof titulo === "string" && titulo ? titulo : "Anúncio";
}

/** Formats a price for notification copy (integer euros, pt-PT grouping). */
export function formatPrice(value: number): string {
  return `${Math.round(value).toLocaleString("pt-PT")} €`;
}
