import { validarDadosVeiculo, CAR_KM_MAX, CAR_YEAR_MIN, carYearMax } from '@/lib/carSpec';

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
    expect(validarDadosVeiculo({ ...valido, seats: '100' }).seats).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, seats: '99' }).seats).toBeUndefined(); // vans/minibuses
    expect(validarDadosVeiculo({ ...valido, seats: '5' }).seats).toBeUndefined();
    expect(validarDadosVeiculo({ ...valido, power: '99999' }).power).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, displacement: '99999' }).displacement).toBeTruthy();
  });

  it('rejects non-integer / non-numeric numeric input', () => {
    expect(validarDadosVeiculo({ ...valido, portas: 'abc' }).portas).toBeTruthy();
    expect(validarDadosVeiculo({ ...valido, anoFabricacao: '2015.5' }).anoFabricacao).toBeTruthy();
  });
});
