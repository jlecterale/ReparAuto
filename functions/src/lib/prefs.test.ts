import { preferenceAllows } from './prefs';

describe('preferenceAllows', () => {
  it('defaults to allowed when nothing is stored', () => {
    expect(preferenceAllows(undefined, 'alerta', 'push')).toBe(true);
    expect(preferenceAllows(null, 'preco', 'inApp')).toBe(true);
  });

  it('respects the per-group per-channel toggles', () => {
    const prefs = { alerta: { inApp: true, push: false } };
    expect(preferenceAllows(prefs, 'alerta', 'inApp')).toBe(true);
    expect(preferenceAllows(prefs, 'alerta', 'push')).toBe(false);
    expect(preferenceAllows(prefs, 'preco', 'push')).toBe(true);
  });

  it('maps notification tipos onto their preference group', () => {
    const prefs = { mensagem: { inApp: false, push: false }, conta: { inApp: true, push: false } };
    expect(preferenceAllows(prefs, 'mensagem', 'push')).toBe(false);
    expect(preferenceAllows(prefs, 'aprovado', 'inApp')).toBe(true);
    expect(preferenceAllows(prefs, 'rejeitado', 'push')).toBe(false);
    expect(preferenceAllows(prefs, 'info', 'push')).toBe(false);
  });

  it('honours the legacy flat shape', () => {
    const legacy = { mensagens: false, aprovacao: true, novosAnuncios: false };
    expect(preferenceAllows(legacy, 'mensagem', 'push')).toBe(false);
    expect(preferenceAllows(legacy, 'aprovado', 'push')).toBe(true);
    expect(preferenceAllows(legacy, 'alerta', 'inApp')).toBe(false);
  });

  it('treats unknown tipos as allowed account notifications', () => {
    expect(preferenceAllows({ conta: { inApp: true, push: true } }, 'whatever', 'push')).toBe(true);
  });
});
