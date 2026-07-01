import {
  formatarPreco,
  validarTelefone,
  validarCodigoPostal,
  formatarCodigoPostal,
  validarNif,
  obterWhatsApp,
  gerarTituloIntencao,
  getYoutubeId,
  getYoutubeEmbedUrl,
  isValidYoutubeUrl,
} from '@/lib/utils';

// Prices are an attribute of the listing, not of the visitor: a Brazilian ad
// always shows R$ and a Portuguese ad always shows €, whatever country the
// viewer is browsing. Callers pass the listing's resolved country.
describe('formatarPreco', () => {
  it('keeps the Portuguese euro format by default', () => {
    expect(formatarPreco(15000)).toBe('15 000 €'); // pt-PT groups with a non-breaking space
    expect(formatarPreco(null)).toBe('0 €');
  });

  it('formats Brazilian listings as BRL with pt-BR separators', () => {
    expect(formatarPreco(15000, 'BR')).toBe('R$ 15.000');
    expect(formatarPreco('1500', 'BR')).toBe('R$ 1.500');
  });

  it('falls back to zero in the requested currency for invalid values', () => {
    expect(formatarPreco(undefined, 'BR')).toBe('R$ 0');
    expect(formatarPreco('abc', 'BR')).toBe('R$ 0');
  });
});

// The car-ad / workshop YouTube feature: accept the link forms a user is likely
// to paste and turn them into a privacy-friendly nocookie embed. The video id is
// the canonical 11-character YouTube id.
const ID = 'dQw4w9WgXcQ';

describe('validarTelefone', () => {
  it('keeps validating Portuguese numbers by default', () => {
    expect(validarTelefone('912 345 678')).toBe(true);
    expect(validarTelefone('212345678')).toBe(true);
    expect(validarTelefone('11987654321')).toBe(false);
  });

  it('accepts Brazilian mobiles (DDD + 9 digits) with common punctuation', () => {
    expect(validarTelefone('11987654321', 'BR')).toBe(true);
    expect(validarTelefone('(11) 98765-4321', 'BR')).toBe(true);
  });

  it('accepts Brazilian landlines (DDD + 8 digits starting 2-5)', () => {
    expect(validarTelefone('1133334444', 'BR')).toBe(true);
  });

  it('rejects Brazilian numbers with invalid DDD or length', () => {
    expect(validarTelefone('0187654321', 'BR')).toBe(false);
    expect(validarTelefone('987654321', 'BR')).toBe(false);
    expect(validarTelefone('912345678', 'BR')).toBe(false);
  });
});

describe('validarCodigoPostal / formatarCodigoPostal', () => {
  it('keeps the Portuguese 0000-000 format by default', () => {
    expect(validarCodigoPostal('4700-123')).toBe(true);
    expect(validarCodigoPostal('01310-100')).toBe(false);
    expect(formatarCodigoPostal('4700123')).toBe('4700-123');
  });

  it('validates Brazilian CEPs (00000-000, hyphen optional)', () => {
    expect(validarCodigoPostal('01310-100', 'BR')).toBe(true);
    expect(validarCodigoPostal('01310100', 'BR')).toBe(true);
    expect(validarCodigoPostal('4700-123', 'BR')).toBe(false);
  });

  it('masks Brazilian CEPs as the user types', () => {
    expect(formatarCodigoPostal('01310100', 'BR')).toBe('01310-100');
    expect(formatarCodigoPostal('01310', 'BR')).toBe('01310');
  });
});

describe('validarNif', () => {
  it('keeps validating Portuguese NIFs by default', () => {
    expect(validarNif('123456789')).toBe(true);
    expect(validarNif('123456780')).toBe(false);
  });

  it('validates Brazilian CPFs (11 digits with check digits)', () => {
    expect(validarNif('529.982.247-25', 'BR')).toBe(true);
    expect(validarNif('52998224725', 'BR')).toBe(true);
    expect(validarNif('52998224724', 'BR')).toBe(false);
  });

  it('rejects CPFs made of a single repeated digit', () => {
    expect(validarNif('111.111.111-11', 'BR')).toBe(false);
  });

  it('validates Brazilian CNPJs (14 digits with check digits)', () => {
    expect(validarNif('11.222.333/0001-81', 'BR')).toBe(true);
    expect(validarNif('11222333000180', 'BR')).toBe(false);
  });
});

describe('obterWhatsApp', () => {
  it('prefixes Portuguese mobiles with 351 by default', () => {
    expect(obterWhatsApp(null, '912 345 678')).toBe('351912345678');
  });

  it('prefixes Brazilian mobiles with 55', () => {
    expect(obterWhatsApp(null, '(11) 98765-4321', 'BR')).toBe('5511987654321');
    expect(obterWhatsApp(null, '5511987654321', 'BR')).toBe('5511987654321');
  });

  it('accepts numbers written with a leading +', () => {
    expect(obterWhatsApp(null, '+55 11 98765-4321', 'BR')).toBe('5511987654321');
    expect(obterWhatsApp(null, '+351 912 345 678')).toBe('351912345678');
  });

  it('returns null for numbers that cannot receive WhatsApp links', () => {
    expect(obterWhatsApp(null, '1133334444', 'BR')).toBeNull();
    expect(obterWhatsApp(null, null, 'BR')).toBeNull();
  });
});

describe('gerarTituloIntencao', () => {
  it('formats the budget in euros for the Portuguese market', () => {
    expect(
      gerarTituloIntencao({ categoria: 'carro', criterios: { marca: 'Fiat', modelo: 'Uno', precoMaximo: 5000 } })
    ).toBe('Procuro carro: Fiat Uno até 5000€');
  });

  it('formats the budget in reais for the Brazilian market', () => {
    expect(
      gerarTituloIntencao({ categoria: 'carro', criterios: { marca: 'Fiat', modelo: 'Uno', precoMaximo: 5000 } }, 'BR')
    ).toBe('Procuro carro: Fiat Uno até R$ 5000');
  });
});

describe('getYoutubeId', () => {
  it('extracts the id from a standard watch URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it('extracts the id from a watch URL with extra query params before v', () => {
    expect(getYoutubeId(`https://www.youtube.com/watch?feature=share&v=${ID}`)).toBe(ID);
  });

  it('extracts the id from a youtu.be short link', () => {
    expect(getYoutubeId(`https://youtu.be/${ID}`)).toBe(ID);
  });

  it('extracts the id from an embed URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it('extracts the id from a shorts URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it('extracts the id from a live URL', () => {
    expect(getYoutubeId(`https://www.youtube.com/live/${ID}`)).toBe(ID);
  });

  it('ignores surrounding whitespace', () => {
    expect(getYoutubeId(`  https://youtu.be/${ID}  `)).toBe(ID);
  });

  it('returns null for null, undefined and empty/blank input', () => {
    expect(getYoutubeId(null)).toBeNull();
    expect(getYoutubeId(undefined)).toBeNull();
    expect(getYoutubeId('')).toBeNull();
    expect(getYoutubeId('   ')).toBeNull();
  });

  it('returns null for a non-YouTube URL', () => {
    expect(getYoutubeId('https://vimeo.com/123456789')).toBeNull();
  });

  it('returns null when the id is the wrong length', () => {
    expect(getYoutubeId('https://youtu.be/tooShort')).toBeNull();
  });
});

describe('getYoutubeEmbedUrl', () => {
  it('builds a nocookie embed URL from a recognizable link', () => {
    expect(getYoutubeEmbedUrl(`https://www.youtube.com/watch?v=${ID}`)).toBe(
      `https://www.youtube-nocookie.com/embed/${ID}`,
    );
  });

  it('returns null for an unrecognizable link', () => {
    expect(getYoutubeEmbedUrl('https://example.com')).toBeNull();
    expect(getYoutubeEmbedUrl(null)).toBeNull();
  });
});

describe('isValidYoutubeUrl', () => {
  it('is true for a recognizable YouTube link', () => {
    expect(isValidYoutubeUrl(`https://youtu.be/${ID}`)).toBe(true);
  });

  it('is false for anything else', () => {
    expect(isValidYoutubeUrl('not a url')).toBe(false);
    expect(isValidYoutubeUrl(undefined)).toBe(false);
  });
});
