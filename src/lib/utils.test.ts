import {
  formatarPreco,
  formatarNumero,
  formatarKm,
  validarTelefone,
  validarCodigoPostal,
  formatarCodigoPostal,
  validarNif,
  obterWhatsApp,
  gerarTituloIntencao,
  getYoutubeId,
  getYoutubeEmbedUrl,
  isValidYoutubeUrl,
  toggleInList,
  parsePositiveInt,
  parseNonNegativeInt,
  sanitizeDecimalInput,
  parseDecimalOrNull,
  parseExternalImageUrl,
  formatMessageTime,
  canOptimizeImage,
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

  // Sellers type local numbers in the WhatsApp field too — wa.me rejects them
  // without a dialing code, so the explicit field is normalized like the phone.
  it('normalizes the explicit WhatsApp field with the market dialing code', () => {
    expect(obterWhatsApp('(11) 98765-4321', null, 'BR')).toBe('5511987654321');
    expect(obterWhatsApp('912 345 678', null, 'PT')).toBe('351912345678');
  });

  it('passes through explicit numbers that already carry a foreign dialing code', () => {
    expect(obterWhatsApp('447700900123', null, 'BR')).toBe('447700900123');
  });

  it('hides the button for an unusable explicit number instead of linking it raw', () => {
    expect(obterWhatsApp('abc', null, 'BR')).toBeNull();
    expect(obterWhatsApp('   ', '11987654321', 'BR')).toBe('5511987654321');
  });
});

describe('formatarNumero / formatarKm', () => {
  it('groups digits with the market locale', () => {
    expect(formatarNumero(150000, 'BR')).toBe('150.000');
    // pt-PT groups with a (non-breaking) space, never a dot.
    expect(formatarNumero(150000, 'PT').replace(/[\u00A0\u202F]/g, ' ')).toBe('150 000');
  });

  it('appends the km unit', () => {
    expect(formatarKm(150000, 'BR')).toBe('150.000 km');
    expect(formatarKm(0, 'BR')).toBe('0 km');
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

describe('toggleInList', () => {
  it('adds an item that is not in the list', () => {
    expect(toggleInList(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
  });

  it('removes an item that is already in the list', () => {
    expect(toggleInList(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('does not mutate the original list', () => {
    const original = ['a'];
    toggleInList(original, 'b');
    toggleInList(original, 'a');
    expect(original).toEqual(['a']);
  });

  it('works on an empty list', () => {
    expect(toggleInList([], 'x')).toEqual(['x']);
  });
});

describe('parsePositiveInt', () => {
  it('parses a positive integer string', () => {
    expect(parsePositiveInt('5')).toBe(5);
    expect(parsePositiveInt(' 120 ')).toBe(120);
  });

  it('returns null for empty or whitespace input', () => {
    expect(parsePositiveInt('')).toBeNull();
    expect(parsePositiveInt('   ')).toBeNull();
  });

  it('returns null for zero, negatives and non-numbers', () => {
    expect(parsePositiveInt('0')).toBeNull();
    expect(parsePositiveInt('-3')).toBeNull();
    expect(parsePositiveInt('abc')).toBeNull();
  });

  it('truncates decimals to an integer', () => {
    expect(parsePositiveInt('4.9')).toBe(4);
  });
});

describe('parseNonNegativeInt', () => {
  it('accepts 0 (unlike parsePositiveInt) and positive integers', () => {
    expect(parseNonNegativeInt('0')).toBe(0);
    expect(parseNonNegativeInt(' 8 ')).toBe(8);
  });

  it('returns null for empty, negative or non-numeric input', () => {
    expect(parseNonNegativeInt('')).toBeNull();
    expect(parseNonNegativeInt('-1')).toBeNull();
    expect(parseNonNegativeInt('abc')).toBeNull();
  });
});

describe('sanitizeDecimalInput', () => {
  it('keeps digits and collapses to a single comma separator', () => {
    expect(sanitizeDecimalInput('5,6')).toBe('5,6');
    expect(sanitizeDecimalInput('5.6')).toBe('5,6');
    expect(sanitizeDecimalInput('7,2,3')).toBe('7,23');
    expect(sanitizeDecimalInput('1a2.b3')).toBe('12,3');
  });

  it('leaves a plain integer untouched', () => {
    expect(sanitizeDecimalInput('12')).toBe('12');
  });
});

describe('parseDecimalOrNull', () => {
  it('parses PT (comma) and dot decimals, including 0', () => {
    expect(parseDecimalOrNull('5,6')).toBe(5.6);
    expect(parseDecimalOrNull('4.8')).toBe(4.8);
    expect(parseDecimalOrNull('0')).toBe(0);
  });

  it('returns null for empty, negative or non-numeric input', () => {
    expect(parseDecimalOrNull('')).toBeNull();
    expect(parseDecimalOrNull('-2')).toBeNull();
    expect(parseDecimalOrNull('abc')).toBeNull();
  });
});

describe('parseExternalImageUrl', () => {
  // Listing photos can be added by pasting an image URL. The parser normalizes
  // what a user is likely to paste and rejects anything that is not a plain
  // web address (other schemes could smuggle scripts or bloat the doc).
  it('accepts a valid https URL', () => {
    expect(parseExternalImageUrl('https://example.com/foto.jpg')).toBe('https://example.com/foto.jpg');
  });

  it('keeps path and query string intact', () => {
    expect(parseExternalImageUrl('https://cdn.example.com/a/b.png?w=800&h=600')).toBe(
      'https://cdn.example.com/a/b.png?w=800&h=600',
    );
  });

  it('upgrades http:// to https://', () => {
    expect(parseExternalImageUrl('http://example.com/foto.jpg')).toBe('https://example.com/foto.jpg');
  });

  it('prepends https:// when the scheme is missing', () => {
    expect(parseExternalImageUrl('example.com/foto.jpg')).toBe('https://example.com/foto.jpg');
  });

  it('ignores surrounding whitespace', () => {
    expect(parseExternalImageUrl('  https://example.com/foto.jpg  ')).toBe('https://example.com/foto.jpg');
  });

  it('returns null for null, undefined and blank input', () => {
    expect(parseExternalImageUrl(null)).toBeNull();
    expect(parseExternalImageUrl(undefined)).toBeNull();
    expect(parseExternalImageUrl('')).toBeNull();
    expect(parseExternalImageUrl('   ')).toBeNull();
  });

  it('rejects non-http(s) schemes', () => {
    expect(parseExternalImageUrl('javascript:alert(1)')).toBeNull();
    expect(parseExternalImageUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(parseExternalImageUrl('blob:https://example.com/uuid')).toBeNull();
    expect(parseExternalImageUrl('ftp://example.com/foto.jpg')).toBeNull();
  });

  it('rejects text that is not a URL', () => {
    expect(parseExternalImageUrl('foto do meu carro')).toBeNull();
  });

  it('rejects hosts without a dot (no bare hostnames)', () => {
    expect(parseExternalImageUrl('https://localhost/foto.jpg')).toBeNull();
  });
});

// Chat message timestamps: WhatsApp-style compact display — time only for
// today, "Ontem" for yesterday, full date for anything older.
describe('formatMessageTime', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 6, 1, 15, 30)); // 01/07/2026 15:30 local
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows only the time for a message sent today', () => {
    expect(formatMessageTime(new Date(2026, 6, 1, 9, 5))).toBe('09:05');
  });

  it('marks a message sent yesterday with "Ontem"', () => {
    expect(formatMessageTime(new Date(2026, 5, 30, 22, 15))).toBe('Ontem, 22:15');
  });

  it('shows the full date for anything older than yesterday', () => {
    expect(formatMessageTime(new Date(2026, 5, 29, 8, 0))).toBe('29/06/2026, 08:00');
    expect(formatMessageTime(new Date(2025, 11, 24, 18, 45))).toBe('24/12/2025, 18:45');
  });

  it('accepts Firestore Timestamp-like objects', () => {
    const asDate = new Date(2026, 6, 1, 12, 0);
    expect(formatMessageTime({ toDate: () => asDate })).toBe('12:00');
    expect(formatMessageTime({ seconds: Math.floor(asDate.getTime() / 1000) })).toBe('12:00');
  });

  it('accepts ISO strings like the sibling date formatters', () => {
    expect(formatMessageTime('2026-07-01T12:00:00')).toBe('12:00');
  });

  it('returns empty for a missing timestamp (pending server write)', () => {
    expect(formatMessageTime(null)).toBe('');
    expect(formatMessageTime(undefined)).toBe('');
  });
});

describe('canOptimizeImage', () => {
  it('accepts local public assets', () => {
    expect(canOptimizeImage('/logo.svg')).toBe(true);
  });

  it('accepts the hosts whitelisted in next.config.ts remotePatterns', () => {
    expect(canOptimizeImage('https://firebasestorage.googleapis.com/v0/b/x/o/foto.jpg')).toBe(true);
    expect(canOptimizeImage('https://lh3.googleusercontent.com/a/avatar')).toBe(true);
  });

  it('rejects pasted external hosts so next/image never throws on them', () => {
    expect(canOptimizeImage('https://example.com/foto.jpg')).toBe(false);
  });

  it('rejects data:/blob: previews and malformed values', () => {
    expect(canOptimizeImage('data:image/png;base64,abc')).toBe(false);
    expect(canOptimizeImage('blob:https://recargarage.com/123')).toBe(false);
    expect(canOptimizeImage('https://')).toBe(false);
  });

  it('rejects lookalike hosts that merely end with the whitelisted name', () => {
    expect(canOptimizeImage('https://evilgoogleusercontent.com/a')).toBe(false);
  });
});
