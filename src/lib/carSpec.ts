// Numeric bounds and validation for the car-listing form. Kept in its own
// dependency-light module (no phosphor/geo imports) so it stays safe to reuse
// anywhere — the bounds also feed the native <input min/max/step> attributes as
// a first line of defence, while validarDadosVeiculo is the authoritative guard.
// Without these a listing could carry absurd specs (year 99999, 500 doors,
// unbounded mileage/price).

export const CAR_YEAR_MIN = 1900;
/** Upper year bound: the next model year (dealers list the coming year early). */
export const carYearMax = () => new Date().getFullYear() + 1;
export const CAR_KM_MAX = 999_999;
export const CAR_DOORS_MIN = 2;
export const CAR_DOORS_MAX = 7;
export const CAR_SEATS_MIN = 1;
// Passenger cars cap at 9; only van/minibus-style body types go higher.
export const CAR_SEATS_MAX = 9;
export const CAR_SEATS_MAX_LARGE = 99;
/** Body types that ship in van/minibus configurations with more than 9 seats. */
export const LARGE_SEAT_BODY_TYPES = ['Carrinha', 'Monovolume'] as const;

/** Max allowed seats for a given body type (99 for vans/minibuses, else 9). */
export function maxSeatsForBodyType(bodyType?: string): number {
  return bodyType && (LARGE_SEAT_BODY_TYPES as readonly string[]).includes(bodyType)
    ? CAR_SEATS_MAX_LARGE
    : CAR_SEATS_MAX;
}
export const CAR_POWER_MAX = 2000; // cv
export const CAR_DISPLACEMENT_MAX = 10_000; // cc
export const CAR_PRICE_MAX = 10_000_000; // €

const REQUIRED = 'Este campo é obrigatório.';

/**
 * Validates the required/numeric fields of the car-listing form and returns a
 * map of `field -> message` for every field in error (empty map = valid). Form
 * values arrive as strings.
 */
export function validarDadosVeiculo(dados: {
  marca?: string;
  modelo?: string;
  anoFabricacao?: string;
  anoModelo?: string;
  km?: string;
  cor?: string;
  portas?: string;
  bodyType?: string;
  seats?: string;
  power?: string;
  displacement?: string;
}): Record<string, string> {
  const erros: Record<string, string> = {};
  const yearMax = carYearMax();

  if (!dados.marca?.trim()) erros.marca = REQUIRED;
  if (!dados.modelo?.trim()) erros.modelo = REQUIRED;
  if (!dados.cor?.trim()) erros.cor = REQUIRED;

  const anoMsg = `Ano deve estar entre ${CAR_YEAR_MIN} e ${yearMax}.`;
  const validarAno = (campo: 'anoFabricacao' | 'anoModelo', raw?: string) => {
    if (!raw) {
      erros[campo] = REQUIRED;
      return;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < CAR_YEAR_MIN || n > yearMax) erros[campo] = anoMsg;
  };
  validarAno('anoFabricacao', dados.anoFabricacao);
  validarAno('anoModelo', dados.anoModelo);

  // km is required but 0 (brand-new) is a legitimate value.
  if (!dados.km && dados.km !== '0') {
    erros.km = REQUIRED;
  } else {
    const n = Number(dados.km);
    if (!Number.isFinite(n) || n < 0 || n > CAR_KM_MAX) {
      erros.km = `Quilometragem deve estar entre 0 e ${CAR_KM_MAX.toLocaleString('pt-PT')}.`;
    }
  }

  if (!dados.portas) {
    erros.portas = REQUIRED;
  } else {
    const n = Number(dados.portas);
    if (!Number.isInteger(n) || n < CAR_DOORS_MIN || n > CAR_DOORS_MAX) {
      erros.portas = `Número de portas deve estar entre ${CAR_DOORS_MIN} e ${CAR_DOORS_MAX}.`;
    }
  }

  // Optional fields: only validated once the user fills them in.
  const validarOpcional = (
    campo: 'seats' | 'power' | 'displacement',
    raw: string | undefined,
    min: number,
    max: number,
    msg: string,
  ) => {
    if (!raw) return;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) erros[campo] = msg;
  };
  const seatsMax = maxSeatsForBodyType(dados.bodyType);
  validarOpcional('seats', dados.seats, CAR_SEATS_MIN, seatsMax, `Lugares deve estar entre ${CAR_SEATS_MIN} e ${seatsMax}.`);
  validarOpcional('power', dados.power, 1, CAR_POWER_MAX, `Potência deve estar entre 1 e ${CAR_POWER_MAX} cv.`);
  validarOpcional('displacement', dados.displacement, 1, CAR_DISPLACEMENT_MAX, `Cilindrada deve estar entre 1 e ${CAR_DISPLACEMENT_MAX.toLocaleString('pt-PT')} cc.`);

  return erros;
}
