import { parseClientsCsv, buildClientsCsvTemplate } from '@/lib/clientCsv';

// CSV import for the professional CRM: accept the files a workshop is likely to
// export from Excel/Numbers/Sheets (BOM, ; or , delimiters, quoted fields) and
// map rows onto ClientInput, reporting per-row errors instead of failing whole.

const HEADER = 'nome,email,telefone,morada,distrito,marca,modelo,ano,matricula,notas';

describe('parseClientsCsv', () => {
  it('parses a simple comma-separated file', () => {
    const { rows, errors } = parseClientsCsv(
      `${HEADER}\nJoão Silva,joao@exemplo.pt,912345678,Rua A 1,Porto,VW,Golf,2018,00-AA-00,Cliente antigo`,
    );
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      nome: 'João Silva',
      email: 'joao@exemplo.pt',
      telefone: '912345678',
      morada: 'Rua A 1',
      distrito: 'Porto',
      estado: 'lead',
      origem: 'csv',
      notas: 'Cliente antigo',
    });
    expect(rows[0].veiculos).toEqual([
      { marca: 'VW', modelo: 'Golf', ano: 2018, matricula: '00-AA-00' },
    ]);
  });

  it('parses a semicolon-separated file (European Excel default)', () => {
    const { rows, errors } = parseClientsCsv(
      `${HEADER.replace(/,/g, ';')}\nAna;ana@x.pt;911111111;;;;;;;`,
    );
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].nome).toBe('Ana');
    expect(rows[0].email).toBe('ana@x.pt');
  });

  it('strips a UTF-8 BOM before matching headers', () => {
    const { rows, errors } = parseClientsCsv(`﻿${HEADER}\nRui,,,,,,,,,`);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].nome).toBe('Rui');
  });

  it('keeps delimiters inside double-quoted fields intact', () => {
    const { rows } = parseClientsCsv(
      `${HEADER}\n"Silva, Lda",geral@silva.pt,,,,,,,,"Cliente, desde 2020"`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].nome).toBe('Silva, Lda');
    expect(rows[0].notas).toBe('Cliente, desde 2020');
  });

  it('unescapes doubled quotes inside quoted fields', () => {
    const { rows } = parseClientsCsv(`${HEADER}\n"O ""Rei"" das Peças",,,,,,,,,`);
    expect(rows[0].nome).toBe('O "Rei" das Peças');
  });

  it('skips rows without a name and reports the line number', () => {
    const { rows, errors } = parseClientsCsv(`${HEADER}\n,semnome@x.pt,,,,,,,,\nZé,,,,,,,,,`);
    expect(rows).toHaveLength(1);
    expect(rows[0].nome).toBe('Zé');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Linha 2');
  });

  it('accepts columns in any order and ignores unknown columns', () => {
    const { rows } = parseClientsCsv('email,extra,nome\nx@y.pt,whatever,Maria');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ nome: 'Maria', email: 'x@y.pt' });
  });

  it('only records a vehicle when marca or modelo is present, and validates ano', () => {
    const { rows } = parseClientsCsv(
      `${HEADER}\nSem Carro,,,,,,,,,\nCom Carro,,,,,Fiat,Punto,abc,,`,
    );
    expect(rows[0].veiculos).toBeUndefined();
    expect(rows[1].veiculos).toEqual([{ marca: 'Fiat', modelo: 'Punto', ano: undefined, matricula: undefined }]);
  });

  it('rejects files without a data line', () => {
    const { rows, errors } = parseClientsCsv(HEADER);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it('ignores blank lines (e.g. trailing newline from Excel)', () => {
    const { rows, errors } = parseClientsCsv(`${HEADER}\nUno,,,,,,,,,\n\n`);
    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });

  it('keeps line breaks inside quoted fields within one record (RFC 4180)', () => {
    const { rows, errors } = parseClientsCsv(
      `${HEADER}\nCarlos,,,,,,,,,"Cliente desde 2020\nPrefere contacto à tarde"\nDepois,,,,,,,,,`,
    );
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].nome).toBe('Carlos');
    expect(rows[0].notas).toBe('Cliente desde 2020\nPrefere contacto à tarde');
    expect(rows[1].nome).toBe('Depois');
  });

  it('handles CRLF line endings, including inside quoted fields', () => {
    const { rows } = parseClientsCsv(`${HEADER}\r\nRita,,,,,,,,,"a\r\nb"\r\n`);
    expect(rows).toHaveLength(1);
    expect(rows[0].notas).toBe('a\nb');
  });
});

describe('buildClientsCsvTemplate', () => {
  it('produces a header row matching the documented column order plus one example row', () => {
    const template = buildClientsCsvTemplate();
    const [header, example, trailer] = template.split('\n');
    expect(header).toBe(HEADER);
    expect(example.split(',').length).toBe(HEADER.split(',').length);
    expect(trailer).toBe('');
  });

  it('round-trips: the template itself parses without errors', () => {
    const { rows, errors } = parseClientsCsv(buildClientsCsvTemplate());
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
  });
});
