import { aiCacheKey, getCachedAiResult, setCachedAiResult } from '@/lib/ia/aiCache';

describe('aiCacheKey', () => {
  it('produces the same key for the same payload regardless of property order', () => {
    const a = aiCacheKey('description', { marca: 'Fiat', modelo: 'Punto', anoFabricacao: 2007 });
    const b = aiCacheKey('description', { anoFabricacao: 2007, modelo: 'Punto', marca: 'Fiat' });
    expect(a).toBe(b);
  });

  it('produces different keys for different features or payloads', () => {
    const base = { marca: 'Fiat', modelo: 'Punto' };
    expect(aiCacheKey('description', base)).not.toBe(aiCacheKey('price', base));
    expect(aiCacheKey('description', base)).not.toBe(
      aiCacheKey('description', { ...base, modelo: 'Panda' }),
    );
  });
});

describe('AI result cache', () => {
  it('returns null on a cache miss', () => {
    expect(getCachedAiResult('missing-key')).toBeNull();
  });

  it('returns the stored value for a known key', () => {
    setCachedAiResult('k1', { description: 'Olá' });
    expect(getCachedAiResult('k1')).toEqual({ description: 'Olá' });
  });

  it('evicts the least-recently-stored entry beyond the cap', () => {
    for (let i = 0; i < 25; i++) {
      setCachedAiResult(`k${i}`, { i });
    }
    expect(getCachedAiResult('k0')).toBeNull();
    expect(getCachedAiResult('k24')).toEqual({ i: 24 });
  });

  it('survives corrupted storage without throwing', () => {
    localStorage.setItem('ai_cache_v1', '{not json');
    expect(getCachedAiResult('k1')).toBeNull();
    setCachedAiResult('k1', { ok: true });
    expect(getCachedAiResult('k1')).toEqual({ ok: true });
  });
});
