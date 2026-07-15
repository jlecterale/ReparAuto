import {
  buildAudioListingPrompt,
  CAR_AUDIO_RESPONSE_SCHEMA,
  geminiAudioMimeType,
  PART_AUDIO_RESPONSE_SCHEMA,
  sanitizeCarFields,
  sanitizePartFields,
} from '@/lib/audioListing';
import {
  CATEGORIAS_PECAS,
  EQUIPAMENTOS_CARRO,
  ESTADOS_PECA,
  TIPOS_CAMBIO,
  TIPOS_CARROCERIA,
  TIPOS_COMBUSTIVEL,
} from '@/lib/constants';

describe('sanitizeCarFields', () => {
  it('keeps canonical enum values and basic strings', () => {
    const fields = sanitizeCarFields({
      marca: 'Renault',
      modelo: 'Clio',
      combustivel: 'Gasolina',
      cambio: 'Manual',
      cor: 'Cinzento',
    });
    expect(fields).toEqual({
      marca: 'Renault',
      modelo: 'Clio',
      combustivel: 'Gasolina',
      cambio: 'Manual',
      cor: 'Cinzento',
    });
  });

  it('matches enums ignoring case and accents, returning the canonical value', () => {
    const fields = sanitizeCarFields({
      combustivel: 'ELETRICO',
      cambio: 'automatico',
      condition: 'usado',
      traction: 'integral (4x4)',
      bodyType: 'suv',
      estadoVeiculo: 'MANUTENCAO',
    });
    expect(fields).toEqual({
      combustivel: 'Elétrico',
      cambio: 'Automático',
      condition: 'Usado',
      traction: 'Integral (4x4)',
      bodyType: 'SUV',
      estadoVeiculo: 'manutencao',
    });
  });

  it('drops enum values outside the domain instead of inventing them', () => {
    const fields = sanitizeCarFields({
      combustivel: 'GPL',
      cambio: 'Sequencial',
      condition: 'Semi-novo',
      estadoVeiculo: 'avariado',
    });
    expect(fields).toEqual({});
  });

  it('accepts numeric fields within domain bounds, coercing numeric strings', () => {
    const fields = sanitizeCarFields({
      anoFabricacao: 2012,
      km: '180000',
      preco: 4500.5,
      portas: 5,
      seats: '5',
      power: 90,
      displacement: 1461,
    });
    expect(fields).toEqual({
      anoFabricacao: 2012,
      km: 180000,
      preco: 4500.5,
      portas: 5,
      seats: 5,
      power: 90,
      displacement: 1461,
    });
  });

  it('drops numeric values outside domain bounds instead of clamping to fake ones', () => {
    const fields = sanitizeCarFields({
      anoFabricacao: 1850,
      km: 5_000_000,
      preco: 0,
      portas: 9,
      seats: 60,
      power: -10,
      displacement: 999_999,
    });
    expect(fields).toEqual({});
  });

  it('allows large seat counts only for van-style body types', () => {
    expect(sanitizeCarFields({ bodyType: 'Carrinha', seats: 12 })).toEqual({
      bodyType: 'Carrinha',
      seats: 12,
    });
    expect(sanitizeCarFields({ bodyType: 'Sedan', seats: 12 })).toEqual({ bodyType: 'Sedan' });
  });

  it('keeps only known equipment features, canonicalized', () => {
    const fields = sanitizeCarFields({
      features: ['ar condicionado', 'Bluetooth', 'Banco de massagens', 'ISOFIX', 42],
    });
    expect(fields).toEqual({ features: ['Ar condicionado', 'Bluetooth', 'Isofix'] });
  });

  it('canonicalizes marca and modelo against the known catalog', () => {
    const fields = sanitizeCarFields({ marca: 'renault', modelo: 'clio' });
    expect(fields).toEqual({ marca: 'Renault', modelo: 'Clio' });
  });

  it('keeps unknown marca/modelo as free text (custom brands are allowed)', () => {
    const fields = sanitizeCarFields({ marca: 'Troller', modelo: 'T4' });
    expect(fields).toEqual({ marca: 'Troller', modelo: 'T4' });
  });

  it('resolves a known concelho to its canonical name and distrito', () => {
    const fields = sanitizeCarFields({ local: 'lisboa' });
    expect(fields).toEqual({ local: 'Lisboa', distrito: 'Lisboa' });
  });

  it('keeps an unknown locality as free text without a distrito', () => {
    const fields = sanitizeCarFields({ local: 'São Paulo' });
    expect(fields).toEqual({ local: 'São Paulo' });
  });

  it('returns an empty object for garbage input', () => {
    expect(sanitizeCarFields(null)).toEqual({});
    expect(sanitizeCarFields('não percebi nada')).toEqual({});
    expect(sanitizeCarFields([1, 2, 3])).toEqual({});
    expect(sanitizeCarFields({ descricao: '   ' })).toEqual({});
  });

  it('trims and caps the descricao', () => {
    const longo = 'a'.repeat(3000);
    const fields = sanitizeCarFields({ descricao: `  ${longo}  ` });
    expect(fields.descricao).toHaveLength(2000);
  });
});

describe('sanitizePartFields', () => {
  it('keeps valid part fields, matching enums case/accent-insensitively', () => {
    const fields = sanitizePartFields({
      tipo: 'VENDA',
      titulo: 'Alternador Renault Clio II',
      categoria: 'motor e transmissao',
      estado: 'usado (segunda mão)',
      marcaCarro: 'renault',
      modeloCarro: 'Clio',
      preco: 60,
      local: 'porto',
      descricao: 'Alternador testado, retirado de um Clio de 2004.',
    });
    expect(fields).toEqual({
      tipo: 'venda',
      titulo: 'Alternador Renault Clio II',
      categoria: 'Motor e Transmissão',
      estado: 'Usado (Segunda Mão)',
      marcaCarro: 'Renault',
      modeloCarro: 'Clio',
      preco: 60,
      local: 'Porto',
      distrito: 'Porto',
      descricao: 'Alternador testado, retirado de um Clio de 2004.',
    });
  });

  it('drops invalid enums and out-of-range prices', () => {
    expect(
      sanitizePartFields({ tipo: 'aluguer', categoria: 'Rodas', estado: 'Partido', preco: -5 }),
    ).toEqual({});
  });

  it('returns an empty object for garbage input', () => {
    expect(sanitizePartFields(null)).toEqual({});
    expect(sanitizePartFields([])).toEqual({});
  });
});

describe('Gemini response schemas', () => {
  it('keeps car schema enums in sync with the domain constants', () => {
    const props = CAR_AUDIO_RESPONSE_SCHEMA.properties;
    expect(props.combustivel.enum).toEqual([...TIPOS_COMBUSTIVEL]);
    expect(props.cambio.enum).toEqual([...TIPOS_CAMBIO]);
    expect(props.bodyType.enum).toEqual([...TIPOS_CARROCERIA]);
    expect(props.features.items.enum).toEqual([...EQUIPAMENTOS_CARRO]);
  });

  it('keeps part schema enums in sync with the domain constants', () => {
    const props = PART_AUDIO_RESPONSE_SCHEMA.properties;
    expect(props.categoria.enum).toEqual([...CATEGORIAS_PECAS]);
    expect(props.estado.enum).toEqual([...ESTADOS_PECA]);
    expect(props.tipo.enum).toEqual(['venda', 'desmonte', 'procura']);
  });
});

describe('geminiAudioMimeType', () => {
  it('maps browser/file MIME variants to a Gemini-supported canonical type', () => {
    expect(geminiAudioMimeType('audio/mpeg')).toBe('audio/mp3');
    expect(geminiAudioMimeType('audio/mp3')).toBe('audio/mp3');
    expect(geminiAudioMimeType('audio/wav')).toBe('audio/wav');
    expect(geminiAudioMimeType('audio/x-wav')).toBe('audio/wav');
    expect(geminiAudioMimeType('audio/mp4')).toBe('audio/aac');
    expect(geminiAudioMimeType('audio/x-m4a')).toBe('audio/aac');
    expect(geminiAudioMimeType('audio/ogg;codecs=opus')).toBe('audio/ogg');
    expect(geminiAudioMimeType('audio/flac')).toBe('audio/flac');
  });

  it('returns undefined for unsupported types', () => {
    expect(geminiAudioMimeType('audio/webm')).toBeUndefined();
    expect(geminiAudioMimeType('video/mp4')).toBeUndefined();
    expect(geminiAudioMimeType('')).toBeUndefined();
  });

  it('falls back to the file extension when the MIME type is generic', () => {
    expect(geminiAudioMimeType('application/octet-stream', 'voz.mp3')).toBe('audio/mp3');
    expect(geminiAudioMimeType('', 'nota.M4A')).toBe('audio/aac');
    expect(geminiAudioMimeType('application/octet-stream', 'video.mov')).toBeUndefined();
  });
});

describe('buildAudioListingPrompt', () => {
  it('produces a kind-specific Portuguese prompt that forbids inventing data', () => {
    const carPrompt = buildAudioListingPrompt('carro');
    const partPrompt = buildAudioListingPrompt('peca');
    expect(carPrompt).toContain('carro');
    expect(partPrompt).toContain('peça');
    expect(carPrompt).not.toEqual(partPrompt);
    for (const prompt of [carPrompt, partPrompt]) {
      expect(prompt.toLowerCase()).toContain('null');
      expect(prompt.toLowerCase()).toContain('não inventes');
    }
  });
});
