import {
  sanitizeAlertText,
  clampInt,
  normalizeNotificationPreferences,
  preferenceGroupForTipo,
  sanitizeAlertSubscriptionInput,
} from './alerts';

describe('sanitizeAlertText', () => {
  it('trims and collapses internal whitespace', () => {
    expect(sanitizeAlertText('  Golf   GTI \n 2019  ', 60)).toBe('Golf GTI 2019');
  });

  it('strips control characters but keeps punctuation and accents', () => {
    expect(sanitizeAlertText('C3 Aircross\u0000\u001f é top!', 60)).toBe('C3 Aircross é top!');
    expect(sanitizeAlertText('Mercedes-Benz C-220', 60)).toBe('Mercedes-Benz C-220');
  });

  it('caps the length without leaving trailing whitespace', () => {
    expect(sanitizeAlertText('abcde fghij', 6)).toBe('abcde');
  });
});

describe('clampInt', () => {
  it('keeps in-range integers and truncates decimals', () => {
    expect(clampInt(5, 0, 10, 0)).toBe(5);
    expect(clampInt(5.9, 0, 10, 0)).toBe(5);
  });

  it('clamps out-of-range values to the bounds', () => {
    expect(clampInt(-3, 0, 10, 0)).toBe(0);
    expect(clampInt(99, 0, 10, 0)).toBe(10);
  });

  it('falls back on non-finite or non-numeric input', () => {
    expect(clampInt(NaN, 0, 10, 7)).toBe(7);
    expect(clampInt(Infinity, 0, 10, 7)).toBe(7);
    expect(clampInt(undefined, 0, 10, 7)).toBe(7);
  });
});

describe('normalizeNotificationPreferences', () => {
  it('returns every channel enabled when nothing is stored', () => {
    const prefs = normalizeNotificationPreferences(undefined);
    expect(prefs).toEqual({
      mensagem: { inApp: true, push: true },
      conta: { inApp: true, push: true },
      alerta: { inApp: true, push: true },
      preco: { inApp: true, push: true },
    });
  });

  it('migrates the legacy flat shape (mensagens/aprovacao/novosAnuncios)', () => {
    const prefs = normalizeNotificationPreferences({
      mensagens: false,
      aprovacao: true,
      novosAnuncios: false,
    });
    expect(prefs.mensagem).toEqual({ inApp: false, push: false });
    expect(prefs.conta).toEqual({ inApp: true, push: true });
    expect(prefs.alerta).toEqual({ inApp: false, push: false });
    expect(prefs.preco).toEqual({ inApp: true, push: true });
  });

  it('merges a partial v2 shape over the defaults', () => {
    const prefs = normalizeNotificationPreferences({ alerta: { push: false } });
    expect(prefs.alerta).toEqual({ inApp: true, push: false });
    expect(prefs.mensagem).toEqual({ inApp: true, push: true });
  });

  it('ignores garbage values without throwing', () => {
    expect(normalizeNotificationPreferences('nope')).toEqual(normalizeNotificationPreferences(undefined));
    expect(normalizeNotificationPreferences({ alerta: 'yes' })).toEqual(normalizeNotificationPreferences(undefined));
  });
});

describe('sanitizeAlertSubscriptionInput — palavra_chave', () => {
  it('sanitizes the keyword and derives a name when none is given', () => {
    const result = sanitizeAlertSubscriptionInput({
      tipo: 'palavra_chave',
      nome: '',
      ativo: true,
      keyword: '  Golf   GTI <script>  ',
    });
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      tipo: 'palavra_chave',
      keyword: 'Golf GTI script', // angle brackets stripped, whitespace collapsed
      nome: 'Golf GTI script',
      ativo: true,
    });
  });

  it('rejects keywords shorter than 2 characters after sanitizing', () => {
    expect(
      sanitizeAlertSubscriptionInput({ tipo: 'palavra_chave', nome: '', ativo: true, keyword: ' <> ' }),
    ).toBeNull();
  });

  it('drops an invalid categoria instead of storing it', () => {
    const result = sanitizeAlertSubscriptionInput({
      tipo: 'palavra_chave',
      nome: 'x',
      ativo: true,
      keyword: 'golf',
      categoria: 'hacked' as never,
    });
    expect(result && 'categoria' in result ? result.categoria : undefined).toBeUndefined();
  });
});

describe('sanitizeAlertSubscriptionInput — criterio', () => {
  it('keeps a whitelisted categoria and sanitized location fields', () => {
    const result = sanitizeAlertSubscriptionInput({
      tipo: 'criterio',
      nome: '',
      ativo: true,
      criteria: { categoria: 'pecas', tipoAnuncio: 'procura', concelho: '  Braga ', marca: ' BMW ' },
    });
    expect(result).toMatchObject({
      tipo: 'criterio',
      criteria: { categoria: 'pecas', tipoAnuncio: 'procura', concelho: 'Braga', marca: 'BMW' },
    });
    expect(result?.nome).toBeTruthy();
  });

  it('rejects an unknown categoria', () => {
    expect(
      sanitizeAlertSubscriptionInput({
        tipo: 'criterio',
        nome: 'x',
        ativo: true,
        criteria: { categoria: 'drogas' as never },
      }),
    ).toBeNull();
  });

  it('drops a tipoAnuncio outside the part-listing kinds', () => {
    const result = sanitizeAlertSubscriptionInput({
      tipo: 'criterio',
      nome: 'x',
      ativo: true,
      criteria: { categoria: 'pecas', tipoAnuncio: '<inject>' },
    });
    expect(result && result.tipo === 'criterio' ? result.criteria.tipoAnuncio : 'kept').toBeUndefined();
  });
});

describe('sanitizeAlertSubscriptionInput — filtro_salvo', () => {
  it('clamps numeric bounds and keeps sanitized strings', () => {
    const result = sanitizeAlertSubscriptionInput({
      tipo: 'filtro_salvo',
      nome: ' Meu filtro ',
      ativo: true,
      filters: {
        marca: '  VW ',
        precoMin: -50,
        precoMax: 999_999_999,
        anoMin: 1200,
        anoMax: 2020.7,
        portas: 99,
        minFotos: -2,
      },
    });
    expect(result).toMatchObject({
      tipo: 'filtro_salvo',
      nome: 'Meu filtro',
      filters: {
        marca: 'VW',
        precoMin: 0,
        precoMax: 5_000_000,
        anoMin: 1900,
        anoMax: 2020,
        portas: 9,
        minFotos: 0,
      },
    });
  });

  it('rejects an empty filter set (would match everything)', () => {
    expect(
      sanitizeAlertSubscriptionInput({ tipo: 'filtro_salvo', nome: 'x', ativo: true, filters: {} }),
    ).toBeNull();
  });

  it('drops a texto shorter than the minimum keyword length', () => {
    const result = sanitizeAlertSubscriptionInput({
      tipo: 'filtro_salvo',
      nome: 'x',
      ativo: true,
      filters: { texto: 'a', marca: 'BMW' },
    });
    expect(result && result.tipo === 'filtro_salvo' ? result.filters : null).toEqual({ marca: 'BMW' });
  });

  it('drops non-finite numbers instead of storing them', () => {
    const result = sanitizeAlertSubscriptionInput({
      tipo: 'filtro_salvo',
      nome: 'x',
      ativo: true,
      filters: { marca: 'BMW', kmMax: NaN as never },
    });
    expect(result && result.tipo === 'filtro_salvo' ? result.filters : null).toEqual({ marca: 'BMW' });
  });
});

describe('preferenceGroupForTipo', () => {
  it('maps each notification tipo to its preference group', () => {
    expect(preferenceGroupForTipo('mensagem')).toBe('mensagem');
    expect(preferenceGroupForTipo('aprovado')).toBe('conta');
    expect(preferenceGroupForTipo('rejeitado')).toBe('conta');
    expect(preferenceGroupForTipo('info')).toBe('conta');
    expect(preferenceGroupForTipo('alerta')).toBe('alerta');
    expect(preferenceGroupForTipo('preco')).toBe('preco');
  });
});
