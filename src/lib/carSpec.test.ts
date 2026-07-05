import {
  validarDadosVeiculo,
  CAR_KM_MAX,
  CAR_YEAR_MIN,
  carYearMax,
  CAR_GEARS_MAX,
  CAR_CO2_MAX,
  CAR_RANGE_MAX,
  CAR_AIRBAGS_MAX,
  CAR_WARRANTY_MONTHS_MAX,
  CAR_CONSUMPTION_MAX,
  CAR_PREVIOUS_OWNERS_MAX,
} from '@/lib/carSpec';

// The car-listing form lets users type free-form numbers; validation must keep a
// listing from carrying absurd specs (year 99999, 500 doors, unbounded mileage).
describe('validarDadosVeiculo', () => {
  const valido = {
    marca: 'BMW',
    modelo: '320d',
    anoFabricacao: '2015',
    anoModelo: '2016',
    km: '120000',
    cor: 'Preto',
    portas: '5',
  };

  it('accepts a fully valid car with no errors', () => {
    expect(validarDadosVeiculo(valido)).toEqual({});
  });

  it('flags required fields when empty', () => {
    const erros = validarDadosVeiculo({});
    expect(erros.marca).toBeTruthy();
    expect(erros.modelo).toBeTruthy();
    expect(erros.anoFabricacao).toBeTruthy();
    expect(erros.anoModelo).toBeTruthy();
    expect(erros.km).toBeTruthy();
    expect(erros.cor).toBeTruthy();
    expect(erros.portas).toBeTruthy();
  });

  it('accepts km of exactly 0 (brand-new) as present', () => {
    expect(validarDadosVeiculo({ ...valido, km: '0' }).km).toBeUndefined();
  });

  it('rejects a year before the minimum', () => {
    expect(validarDadosVeiculo({ ...valido, anoFabricacao: String(CAR_YEAR_MIN - 1) }).anoFabricacao).toBeTruthy();
  });

  it('rejects a year beyond next year', () => {
    expect(validarDadosVeiculo({ ...valido, anoModelo: String(carYearMax() + 1) }).anoModelo).toBeTruthy();
  });

  it('accepts next year as the upper year bound', () => {
    expect(validarDadosVeiculo({ ...valido, anoModelo: String(carYearMax()) }).anoModelo).toBeUndefined();
  });

  it('rejects mileage above the cap', () => {
    expect(validarDadosVeiculo({ ...valido, km: String(CAR_KM_MAX + 1) }).km).toBeTruthy();
  });

  it('accepts mileage at exactly the cap', () => {
    expect(validarDadosVeiculo({ ...valido, km: String(CAR_KM_MAX) }).km).toBeUndefined();
  });

  it('rejects negative mileage', () => {
    expect(validarDadosVeiculo({ ...valido, km: '-5' }).km).toBeTruthy();
  });

  it('rejects an out-of-range door count', () => {
    expect(validarDadosVeiculo({ ...valido, portas: '500' }).portas).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, portas: '1' }).portas).toBeTruthy();
  });

  it('leaves optional numeric fields alone when empty', () => {
    const erros = validarDadosVeiculo(valido);
    expect(erros.seats).toBeUndefined();
    expect(erros.power).toBeUndefined();
    expect(erros.displacement).toBeUndefined();
  });

  it('validates optional fields only once filled', () => {
    expect(validarDadosVeiculo({ ...valido, seats: '5' }).seats).toBeUndefined();
    expect(validarDadosVeiculo({ ...valido, power: '99999' }).power).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, displacement: '99999' }).displacement).toBeTruthy();
  });

  it('caps seats at 9 for passenger-car body types', () => {
    expect(validarDadosVeiculo({ ...valido, seats: '9' }).seats).toBeUndefined();
    expect(validarDadosVeiculo({ ...valido, seats: '10' }).seats).toBeTruthy();
    // an explicit passenger body type is still capped at 9
    expect(validarDadosVeiculo({ ...valido, bodyType: 'Coupé', seats: '15' }).seats).toBeTruthy();
  });

  it('allows up to 99 seats for van/minibus body types (Carrinha, Monovolume)', () => {
    expect(validarDadosVeiculo({ ...valido, bodyType: 'Carrinha', seats: '15' }).seats).toBeUndefined();
    expect(validarDadosVeiculo({ ...valido, bodyType: 'Monovolume', seats: '99' }).seats).toBeUndefined();
    expect(validarDadosVeiculo({ ...valido, bodyType: 'Carrinha', seats: '100' }).seats).toBeTruthy();
  });

  it('rejects non-integer / non-numeric numeric input', () => {
    expect(validarDadosVeiculo({ ...valido, portas: 'abc' }).portas).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, anoFabricacao: '2015.5' }).anoFabricacao).toBeTruthy();
  });

  // ---- Standvirtual-parity optional fields (added together) ----

  it('leaves the new optional fields alone when empty', () => {
    const erros = validarDadosVeiculo(valido);
    expect(erros.gears).toBeUndefined();
    expect(erros.previousOwners).toBeUndefined();
    expect(erros.co2Emissions).toBeUndefined();
    expect(erros.maxFuelRange).toBeUndefined();
    expect(erros.numberOfAirbags).toBeUndefined();
    expect(erros.warrantyMonths).toBeUndefined();
    expect(erros.firstRegistrationMonth).toBeUndefined();
    expect(erros.consumptionUrban).toBeUndefined();
    expect(erros.consumptionExtraUrban).toBeUndefined();
    expect(erros.consumptionCombined).toBeUndefined();
  });

  it('accepts valid integer specs', () => {
    const erros = validarDadosVeiculo({
      ...valido,
      gears: '7',
      previousOwners: '1',
      co2Emissions: '120',
      maxFuelRange: '900',
      numberOfAirbags: '8',
      warrantyMonths: '12',
      firstRegistrationMonth: '3',
    });
    expect(erros.gears).toBeUndefined();
    expect(erros.previousOwners).toBeUndefined();
    expect(erros.co2Emissions).toBeUndefined();
    expect(erros.maxFuelRange).toBeUndefined();
    expect(erros.numberOfAirbags).toBeUndefined();
    expect(erros.warrantyMonths).toBeUndefined();
    expect(erros.firstRegistrationMonth).toBeUndefined();
  });

  it('accepts previousOwners of exactly 0 (first owner selling)', () => {
    expect(validarDadosVeiculo({ ...valido, previousOwners: '0' }).previousOwners).toBeUndefined();
  });

  it('rejects integer specs above their cap', () => {
    expect(validarDadosVeiculo({ ...valido, gears: String(CAR_GEARS_MAX + 1) }).gears).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, previousOwners: String(CAR_PREVIOUS_OWNERS_MAX + 1) }).previousOwners).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, co2Emissions: String(CAR_CO2_MAX + 1) }).co2Emissions).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, maxFuelRange: String(CAR_RANGE_MAX + 1) }).maxFuelRange).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, numberOfAirbags: String(CAR_AIRBAGS_MAX + 1) }).numberOfAirbags).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, warrantyMonths: String(CAR_WARRANTY_MONTHS_MAX + 1) }).warrantyMonths).toBeTruthy();
  });

  it('rejects an out-of-range first-registration month', () => {
    expect(validarDadosVeiculo({ ...valido, firstRegistrationMonth: '0' }).firstRegistrationMonth).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, firstRegistrationMonth: '13' }).firstRegistrationMonth).toBeTruthy();
  });

  it('accepts decimal fuel consumption with a dot or a comma', () => {
    expect(validarDadosVeiculo({ ...valido, consumptionCombined: '5.6' }).consumptionCombined).toBeUndefined();
    expect(validarDadosVeiculo({ ...valido, consumptionUrban: '7,2' }).consumptionUrban).toBeUndefined();
    expect(validarDadosVeiculo({ ...valido, consumptionExtraUrban: '4' }).consumptionExtraUrban).toBeUndefined();
  });

  it('rejects fuel consumption above the cap or negative', () => {
    expect(validarDadosVeiculo({ ...valido, consumptionCombined: String(CAR_CONSUMPTION_MAX + 1) }).consumptionCombined).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, consumptionUrban: '-1' }).consumptionUrban).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, consumptionExtraUrban: 'abc' }).consumptionExtraUrban).toBeTruthy();
  });
});
