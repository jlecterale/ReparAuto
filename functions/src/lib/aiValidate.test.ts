import {
  clampInt,
  toPlainText,
  repairDescription,
  repairPriceSuggestion,
  repairDamageResult,
} from './aiValidate';

describe('clampInt', () => {
  it('clamps into range and rounds', () => {
    expect(clampInt(5.7, 0, 10, 0)).toBe(6);
    expect(clampInt(-5, 0, 10, 0)).toBe(0);
    expect(clampInt(99, 0, 10, 0)).toBe(10);
  });

  it('falls back on non-numeric input', () => {
    expect(clampInt('abc', 0, 10, 3)).toBe(3);
    expect(clampInt(NaN, 0, 10, 3)).toBe(3);
  });
});

describe('toPlainText (model output is untrusted)', () => {
  it('strips HTML so model output can never become markup', () => {
    expect(toPlainText('<script>alert(1)</script>Olá <b>mundo</b>', 100)).toBe('Olá mundo');
  });

  it('strips code fences and backticks', () => {
    expect(toPlainText('```html\nOlá\n```', 100)).toBe('Olá');
  });

  it('caps length', () => {
    expect(toPlainText('a'.repeat(50), 10)).toHaveLength(10);
  });
});

describe('repairDescription', () => {
  it('returns sanitized plain text', () => {
    expect(repairDescription({ description: 'Carro <b>impecável</b>.' })).toBe('Carro impecável.');
  });

  it('returns null for missing/empty output', () => {
    expect(repairDescription({})).toBeNull();
    expect(repairDescription({ description: '   ' })).toBeNull();
    expect(repairDescription(null)).toBeNull();
  });
});

describe('repairPriceSuggestion', () => {
  it('clamps values and reorders min ≤ recommended ≤ max', () => {
    const out = repairPriceSuggestion({
      priceMin: 9000, priceRecommended: 4000, priceMax: 6000, reasoning: 'ok',
    });
    expect(out).toEqual({ priceMin: 4000, priceRecommended: 6000, priceMax: 9000, reasoning: 'ok' });
  });

  it('rejects a suggestion without a positive recommended price', () => {
    expect(repairPriceSuggestion({ priceRecommended: 0, reasoning: 'x' })).toBeNull();
    expect(repairPriceSuggestion(null)).toBeNull();
  });

  it('sanitizes the reasoning to plain text', () => {
    const out = repairPriceSuggestion({
      priceMin: 1, priceRecommended: 2, priceMax: 3, reasoning: '<i>mercado</i> estável',
    });
    expect(out?.reasoning).toBe('mercado estável');
  });
});

describe('repairDamageResult', () => {
  it('clamps coordinates to 0–1 fractions and whitelists severity', () => {
    const out = repairDamageResult({
      summary: 'Danos ligeiros',
      damages: [
        { label: 'Risco na porta', severity: 'severe', x: -0.2, y: 0.5, width: 1.8, height: 0.1 },
        { label: 'Mossa', severity: 'gravíssimo', x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      ],
    });
    expect(out.damages[0]).toEqual({ label: 'Risco na porta', severity: 'severe', x: 0, y: 0.5, width: 1, height: 0.1 });
    expect(out.damages[1].severity).toBe('minor');
  });

  it('drops areas without a visible box and caps the list', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      label: `d${i}`, severity: 'minor', x: 0, y: 0, width: 0.1, height: 0.1,
    }));
    const out = repairDamageResult({
      summary: 's',
      damages: [{ label: 'invisível', severity: 'minor', x: 0.5, y: 0.5, width: 0, height: 0.3 }, ...many],
    });
    expect(out.damages.every((d) => d.width > 0 && d.height > 0)).toBe(true);
    expect(out.damages.length).toBeLessThanOrEqual(12);
  });

  it('tolerates garbage output', () => {
    expect(repairDamageResult(null)).toEqual({ summary: '', damages: [] });
    expect(repairDamageResult({ damages: 'nope' })).toEqual({ summary: '', damages: [] });
  });
});
