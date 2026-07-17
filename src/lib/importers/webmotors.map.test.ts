import { mapWebmotorsAdvertToCarroFormData, buildWebmotorsCarroPayload } from '@/lib/importers/webmotors.map';
import type { NormalizedAdvert } from '@/lib/importers/standvirtual.nextdata';

const MOCK_ADVERT: NormalizedAdvert = {
  adId: '2',
  url: 'https://www.webmotors.com.br/comprar/porsche/911/2',
  title: 'Porsche 911 Carrera T',
  descriptionHtml: 'Carro impecável.<br>Manual.',
  priceValue: 1450000,
  currency: 'BRL',
  photos: ['https://img.webmotors.com/1.jpg'],
  params: {
    marca: { value: 'porsche', label: 'Porsche' },
    modelo: { value: '911', label: '911' },
    versao: { value: 'carrerat', label: 'Carrera T' },
    ano: { value: '2024', label: '2024' },
    quilometragem: { value: '2500', label: '2500 km' },
    combustivel: { value: 'gasolina', label: 'Gasolina' },
    cambio: { value: 'manual', label: 'Manual' },
    cor: { value: 'branco', label: 'Branco' },
  },
  equipmentKeys: ['arcondicionado', 'direcaohidraulica', 'tetosolar'],
  location: {},
  active: true,
};

describe('mapWebmotorsAdvertToCarroFormData', () => {
  it('maps NormalizedAdvert to CarroFormData for Brazil', () => {
    const { dados, unmappedFields } = mapWebmotorsAdvertToCarroFormData(MOCK_ADVERT);
    expect(dados.marca).toBe('Porsche');
    expect(dados.modelo).toBe('911');
    expect(dados.version).toBe('Carrera T');
    expect(dados.anoFabricacao).toBe('2024');
    expect(dados.km).toBe('2500');
    expect(dados.preco).toBe('1450000');
    expect(dados.combustivel).toBe('Gasolina');
    expect(dados.cambio).toBe('Manual');
    expect(dados.cor).toBe('Branco');
    expect(dados.features).toContain('Ar condicionado');
    expect(dados.features).toContain('Direção assistida');
    expect(dados.features).toContain('Teto de abrir');
    expect(dados.descricao).toBe('Carro impecável.\nManual.');
  });
});

describe('buildWebmotorsCarroPayload', () => {
  it('builds a clean Firestore payload from mapped form data', () => {
    const { dados } = mapWebmotorsAdvertToCarroFormData(MOCK_ADVERT);
    const payload = buildWebmotorsCarroPayload({
      ...dados,
      localizacao: 'São Paulo',
      localizacaoDistrito: 'SP',
    });
    expect(payload.marca).toBe('Porsche');
    expect(payload.modelo).toBe('911');
    expect(payload.anoFabricacao).toBe(2024);
    expect(payload.preco).toBe(1450000);
    expect(payload.km).toBe(2500);
    expect(payload.combustivel).toBe('Gasolina');
    expect(payload.cambio).toBe('Manual');
    expect(payload.local).toBe('São Paulo');
    expect(payload.distrito).toBe('SP');
  });
});
