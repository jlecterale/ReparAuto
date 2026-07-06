import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildCarroPayload,
  mapAdvertToCarroFormData,
} from '@/lib/importers/standvirtual.map';
import {
  normalizeStandvirtualAdvert,
  type NormalizedAdvert,
} from '@/lib/importers/standvirtual.nextdata';

const advertFixture = JSON.parse(
  readFileSync(join(__dirname, '__fixtures__', 'standvirtual-advert.json'), 'utf-8'),
);

function realAdvert(): NormalizedAdvert {
  return normalizeStandvirtualAdvert(
    { props: { pageProps: { advert: advertFixture } } },
    advertFixture.url,
  )!;
}

function advertWith(overrides: Partial<NormalizedAdvert>): NormalizedAdvert {
  return { ...realAdvert(), ...overrides };
}

describe('mapAdvertToCarroFormData — real fixture', () => {
  it('maps the technical sheet to form fields', () => {
    const { dados } = mapAdvertToCarroFormData(realAdvert());
    expect(dados.marca).toBe('Citroën');
    expect(dados.modelo).toBe('C4 Cactus');
    expect(dados.anoFabricacao).toBe('2018');
    expect(dados.anoModelo).toBe('2018');
    expect(dados.km).toBe('73365');
    expect(dados.preco).toBe('10890');
    expect(dados.combustivel).toBe('Gasolina');
    expect(dados.cambio).toBe('Automático');
    expect(dados.cor).toBe('Cinzento');
    expect(dados.portas).toBe('5');
    expect(dados.seats).toBe('5');
    expect(dados.power).toBe('110');
    expect(dados.displacement).toBe('1199');
    expect(dados.bodyType).toBe('SUV');
    expect(dados.traction).toBe('Dianteira');
    expect(dados.condition).toBe('Usado');
  });

  it('matches the seller location against the concelho list', () => {
    const { dados } = mapAdvertToCarroFormData(realAdvert());
    expect(dados.localizacao).toBe('Barcelos');
    expect(dados.localizacaoDistrito).toBe('Braga');
  });

  it('converts the HTML description to plain text', () => {
    const { dados } = mapAdvertToCarroFormData(realAdvert());
    expect(dados.descricao).not.toMatch(/<[a-z]+/i);
    expect(dados.descricao).toContain('Stop&Start');
    expect(dados.descricao!.length).toBeGreaterThan(50);
  });

  it('maps known equipment to the features checklist', () => {
    const { dados } = mapAdvertToCarroFormData(realAdvert());
    expect(dados.features).toEqual(expect.arrayContaining(['Bluetooth', 'GPS / Navegação']));
    // No invented entries outside the site's checklist vocabulary.
    expect(dados.features).not.toContain('Rádio');
  });

  it('reports nothing to review when every field maps', () => {
    const { unmappedFields } = mapAdvertToCarroFormData(realAdvert());
    expect(unmappedFields).toEqual([]);
  });

  it('maps the Standvirtual-parity fields present in the real advert (plan 25)', () => {
    const { dados } = mapAdvertToCarroFormData(realAdvert());
    expect(dados.version).toBe('PureTech 110 Stop&Start EAT6 Shine');
    expect(dados.firstRegistrationMonth).toBe('8');
    expect(dados.origin).toBe('Importado'); // is_imported_car = Sim
    expect(dados.acceptsFinancing).toBe(true); // accept_funding
    expect(dados.acceptsExchange).toBe(true); // accept_returns ("Aceita retoma")
    expect(dados.warrantyMonths).toBe('18'); // vendors_warranty_valid_until_date = "18 Meses"
  });
});

describe('mapAdvertToCarroFormData — parity fields via synthetic params', () => {
  const parityParams = {
    is_imported_car: { value: '0', label: 'Não' },
    upholstery: { value: 'leather', label: 'Pele' },
    nr_gears: { value: '6', label: '6' },
    co2_emissions: { value: '126', label: '126 g/km' },
    urban_consumption: { value: '6.1', label: '6,1 l/100km' },
    extra_urban_consumption: { value: '4,2', label: '4,2 l/100km' },
    mixed_consumption: { value: '5.0', label: '5 l/100km' },
    nr_of_owners: { value: '1', label: '1' },
    nr_of_airbags: { value: '6', label: '6' },
    max_fuel_range: { value: '540', label: '540 km' },
  };

  it('maps upholstery, gears, emissions, consumptions, owners, airbags and range', () => {
    const advert = advertWith({ params: { ...realAdvert().params, ...parityParams } });
    const { dados } = mapAdvertToCarroFormData(advert);
    expect(dados.origin).toBe('Nacional');
    expect(dados.upholstery).toBe('Pele');
    expect(dados.gears).toBe('6');
    expect(dados.co2Emissions).toBe('126');
    expect(dados.consumptionUrban).toBe('6.1');
    expect(dados.consumptionExtraUrban).toBe('4.2'); // PT comma normalized
    expect(dados.consumptionCombined).toBe('5.0');
    expect(dados.previousOwners).toBe('1');
    expect(dados.numberOfAirbags).toBe('6');
    expect(dados.maxFuelRange).toBe('540');
  });

  it('flags an unknown upholstery value without blocking', () => {
    const advert = advertWith({
      params: { ...realAdvert().params, upholstery: { value: 'carbon-fiber', label: 'Fibra' } },
    });
    const { dados, unmappedFields } = mapAdvertToCarroFormData(advert);
    expect(dados.upholstery).toBeUndefined();
    expect(unmappedFields).toContain('upholstery');
  });
});

describe('mapAdvertToCarroFormData — unknown values never block', () => {
  it('leaves fuel empty and flags it when the value is unknown (e.g. GPL)', () => {
    const advert = advertWith({
      params: { ...realAdvert().params, fuel_type: { value: 'petrol-lpg', label: 'GPL' } },
    });
    const { dados, unmappedFields } = mapAdvertToCarroFormData(advert);
    expect(dados.combustivel).toBeUndefined();
    expect(unmappedFields).toContain('combustivel');
  });

  it('flags an unknown body type but keeps mapping the rest', () => {
    const advert = advertWith({
      params: { ...realAdvert().params, body_type: { value: 'spaceship', label: 'Nave' } },
    });
    const { dados, unmappedFields } = mapAdvertToCarroFormData(advert);
    expect(dados.bodyType).toBeUndefined();
    expect(unmappedFields).toContain('bodyType');
    expect(dados.marca).toBe('Citroën');
  });

  it('keeps the raw make/model text and flags them when not in the catalog', () => {
    const advert = advertWith({
      params: {
        ...realAdvert().params,
        make: { value: 'zil', label: 'ZIL' },
        model: { value: 'zil-130', label: '130' },
      },
    });
    const { dados, unmappedFields } = mapAdvertToCarroFormData(advert);
    expect(dados.marca).toBe('ZIL');
    expect(dados.modelo).toBe('130');
    expect(unmappedFields).toEqual(expect.arrayContaining(['marca', 'modelo']));
  });

  it('flags the location when no concelho matches', () => {
    const advert = advertWith({
      location: { city: 'Lugar Desconhecido', concelhoSlug: 'nowhere', region: 'Braga' },
    });
    const { dados, unmappedFields } = mapAdvertToCarroFormData(advert);
    expect(dados.localizacao).toBeUndefined();
    expect(dados.localizacaoDistrito).toBe('Braga');
    expect(unmappedFields).toContain('localizacao');
  });

  it('flags missing price and mileage', () => {
    const advert = advertWith({ priceValue: null });
    const params = { ...realAdvert().params };
    delete params.mileage;
    advert.params = params;
    const { dados, unmappedFields } = mapAdvertToCarroFormData(advert);
    expect(dados.preco).toBeUndefined();
    expect(dados.km).toBeUndefined();
    expect(unmappedFields).toEqual(expect.arrayContaining(['preco', 'km']));
  });

  it('maps a manual diesel estate via slugs when labels are missing', () => {
    const advert = advertWith({
      params: {
        make: { value: 'ford', label: 'Ford' },
        model: { value: 'focus', label: 'Focus' },
        fuel_type: { value: 'diesel', label: 'diesel' },
        gearbox: { value: 'manual', label: 'manual' },
        body_type: { value: 'combi', label: 'combi' },
        first_registration_year: { value: '2010', label: '2010' },
        mileage: { value: '220000', label: '220 000 km' },
      },
      equipmentKeys: [],
    });
    const { dados } = mapAdvertToCarroFormData(advert);
    expect(dados.combustivel).toBe('Diesel');
    expect(dados.cambio).toBe('Manual');
    expect(dados.bodyType).toBe('Carrinha');
    expect(dados.marca).toBe('Ford');
    expect(dados.modelo).toBe('Focus');
  });
});

describe('buildCarroPayload', () => {
  it('converts form strings into the Firestore car payload', () => {
    const { dados } = mapAdvertToCarroFormData(realAdvert());
    const payload = buildCarroPayload(dados);
    expect(payload.marca).toBe('Citroën');
    expect(payload.preco).toBe(10890);
    expect(payload.km).toBe(73365);
    expect(payload.portas).toBe(5);
    expect(payload.anoFabricacao).toBe(2018);
    expect(payload.seats).toBe(5);
    expect(payload.power).toBe(110);
    expect(payload.local).toBe('Barcelos');
    expect(payload.distrito).toBe('Braga');
    expect(payload.version).toBe('PureTech 110 Stop&Start EAT6 Shine');
    expect(payload.firstRegistrationMonth).toBe(8);
    expect(payload.origin).toBe('Importado');
    expect(payload.acceptsFinancing).toBe(true);
    expect(payload.acceptsExchange).toBe(true);
    expect(payload.warrantyMonths).toBe(18);
    expect(payload.coordenadas).toEqual({ lat: expect.any(Number), lng: expect.any(Number) });
    expect(payload.estadoVeiculo).toBe('pronto');
    expect(payload.tiposManutencao).toEqual([]);
    expect(payload.rodando).toBe(true);
    expect(payload.inspecao).toBe(true);
  });

  it('omits fields that did not map instead of writing empty values', () => {
    const payload = buildCarroPayload({ marca: 'Ford', preco: '1000' });
    expect(payload).not.toHaveProperty('km');
    expect(payload).not.toHaveProperty('combustivel');
    expect(payload).not.toHaveProperty('coordenadas');
    expect(payload).not.toHaveProperty('bodyType');
  });
});
