import type { Carro } from '@/types/carro';

// Criteria for the vehicle-spec filters introduced alongside the richer listing
// form (category, condition, fuel, transmission, seats, traction, equipment).
// Empty strings / empty arrays / nullish values mean "no filter for this field".
export interface CarSpecCriteria {
  bodyType?: string;
  condition?: string;
  combustivel?: string;
  cambio?: string;
  seatsMin?: number | null;
  traction?: string;
  features?: string[];
}

/**
 * Pure predicate: does a car match every active spec criterion? Kept separate
 * from the `useCarros` hook so the matching logic is unit-testable without a
 * Firestore subscription. `seatsMin` is a minimum (>=); `features` requires ALL
 * selected items to be present on the car.
 */
export function matchesCarSpecFilters(carro: Carro, criteria: CarSpecCriteria): boolean {
  if (criteria.bodyType && carro.bodyType !== criteria.bodyType) return false;
  if (criteria.condition && carro.condition !== criteria.condition) return false;
  if (criteria.combustivel && carro.combustivel !== criteria.combustivel) return false;
  if (criteria.cambio && carro.cambio !== criteria.cambio) return false;

  if (criteria.seatsMin != null && !Number.isNaN(criteria.seatsMin)) {
    if (carro.seats == null || carro.seats < criteria.seatsMin) return false;
  }

  if (criteria.traction && carro.traction !== criteria.traction) return false;

  if (criteria.features && criteria.features.length > 0) {
    const owned = carro.features ?? [];
    if (!criteria.features.every((f) => owned.includes(f))) return false;
  }

  return true;
}
