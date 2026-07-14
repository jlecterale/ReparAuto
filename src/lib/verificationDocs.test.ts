import { documentosPermitidos, DOCUMENTO_LABELS } from '@/lib/verificationDocs';

// The accepted identity/business documents differ by market (plan 20): a
// Portuguese seller uploads a Cartão de Cidadão, a Brazilian one an RG or CNH,
// and a Brazilian professional (stand/oficina) the company's CNPJ/contrato.
describe('documentosPermitidos', () => {
  it('offers the Portuguese ID documents for personal verification in PT', () => {
    expect(documentosPermitidos('PT', 'identidade').map((d) => d.value)).toEqual([
      'cc',
      'passaporte',
      'residencia',
    ]);
  });

  it('offers RG / CNH / passport for personal verification in BR', () => {
    expect(documentosPermitidos('BR', 'identidade').map((d) => d.value)).toEqual([
      'cnh',
      'rg',
      'passaporte',
    ]);
  });

  it('asks for the company registration for professional verification in BR', () => {
    expect(documentosPermitidos('BR', 'profissional').map((d) => d.value)).toEqual([
      'cnpj',
      'contrato_social',
    ]);
  });

  it('labels every offered document from the shared label map', () => {
    for (const country of ['PT', 'BR'] as const) {
      for (const tipo of ['identidade', 'profissional'] as const) {
        for (const opt of documentosPermitidos(country, tipo)) {
          expect(opt.label).toBe(DOCUMENTO_LABELS[opt.value]);
          expect(opt.label.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
