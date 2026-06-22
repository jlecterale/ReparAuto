import { describe, it, expect } from '@jest/globals';
import {
  formatarPreco,
  validarEmail,
  validarTelefone,
  validarCodigoPostal,
  formatarCodigoPostal,
  validarNif,
  renderDescricao,
  obterWhatsApp,
  gerarTituloIntencao,
  validarIntencaoCompra,
} from '@/lib/utils';

describe('formatarPreco', () => {
  it('appends the euro suffix to a numeric value', () => {
    expect(formatarPreco(0)).toBe('0 €');
  });

  it('falls back to "0 €" for null, undefined or non-numeric input', () => {
    expect(formatarPreco(null)).toBe('0 €');
    expect(formatarPreco(undefined)).toBe('0 €');
    expect(formatarPreco('abc')).toBe('0 €');
  });

  it('keeps the euro symbol for a real amount', () => {
    expect(formatarPreco(1500)).toContain('€');
  });
});

describe('validarEmail', () => {
  it('accepts a well-formed address', () => {
    expect(validarEmail('user@example.pt')).toBe(true);
  });

  it('rejects an address without a domain', () => {
    expect(validarEmail('user@')).toBe(false);
  });
});

describe('validarTelefone', () => {
  it.each(['912345678', '212345678', '912 345 678'])('accepts Portuguese number %s', (n) => {
    expect(validarTelefone(n)).toBe(true);
  });

  it.each(['812345678', '91234567', '12345678'])('rejects invalid number %s', (n) => {
    expect(validarTelefone(n)).toBe(false);
  });
});

describe('postal code', () => {
  it('validates the NNNN-NNN format', () => {
    expect(validarCodigoPostal('1000-100')).toBe(true);
    expect(validarCodigoPostal('1000100')).toBe(false);
  });

  it('formats raw digits into NNNN-NNN', () => {
    expect(formatarCodigoPostal('1000100')).toBe('1000-100');
    expect(formatarCodigoPostal('1000')).toBe('1000');
  });
});

describe('validarNif', () => {
  it('accepts a NIF with a valid mod-11 check digit', () => {
    expect(validarNif('123456789')).toBe(true);
  });

  it('rejects a NIF with a wrong check digit', () => {
    expect(validarNif('123456788')).toBe(false);
  });

  it('rejects a NIF whose first digit is not allowed', () => {
    expect(validarNif('423456789')).toBe(false);
  });
});

describe('renderDescricao', () => {
  it('escapes HTML so user input cannot inject markup', () => {
    const html = renderDescricao('<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('converts **bold** mini-markdown into <strong>', () => {
    expect(renderDescricao('**hi**')).toContain('<strong>hi</strong>');
  });
});

describe('obterWhatsApp', () => {
  it('prefixes a Portuguese mobile number with the country code', () => {
    expect(obterWhatsApp(undefined, '912345678')).toBe('351912345678');
  });

  it('prefers an explicit whatsapp number when provided', () => {
    expect(obterWhatsApp('351912345678', '912345678')).toBe('351912345678');
  });

  it('returns null when no usable number is available', () => {
    expect(obterWhatsApp(undefined, '123')).toBeNull();
  });
});

describe('gerarTituloIntencao', () => {
  it('builds a car search title from the criteria', () => {
    expect(
      gerarTituloIntencao({ categoria: 'carro', criterios: { marca: 'BMW', modelo: '320d', precoMaximo: 20000 } }),
    ).toBe('Procuro carro: BMW 320d até 20000€');
  });

  it('builds a part search title from the description', () => {
    expect(gerarTituloIntencao({ categoria: 'pecas', descricao: 'farol' })).toBe('Procuro peça: farol');
  });
});

describe('validarIntencaoCompra', () => {
  it('accepts a fully specified car intent', () => {
    const result = validarIntencaoCompra({
      categoria: 'carro',
      criterios: {
        marca: 'BMW',
        modelo: '320',
        anoMinimo: 2010,
        anoMaximo: 2020,
        precoMinimo: 5000,
        precoMaximo: 20000,
        quilometragemMaxima: 150000,
        combustivel: ['diesel'],
        tipoTransmissao: ['manual'],
        localizacao: { distrito: 'Lisboa', raio: 50 },
      },
      contatoPreferido: 'chat',
    });
    expect(result.valido).toBe(true);
    expect(result.erros).toHaveLength(0);
  });

  it('reports the missing category for an empty intent', () => {
    const result = validarIntencaoCompra({});
    expect(result.valido).toBe(false);
    expect(result.erros).toContain('Categoria é obrigatória');
  });
});
