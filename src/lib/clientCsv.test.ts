import { parseClientsCsv, buildClientsCsvTemplate, processClientsImport } from '@/lib/clientCsv';
import { Timestamp } from 'firebase/firestore';
import type { Client, ClientInput } from '@/types/client';


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

describe('processClientsImport', () => {
  const dummyTimestamp = Timestamp.now();
  const existingClients: Client[] = [
    {
      id: 'c1',
      ownerUid: 'owner-1',
      nome: 'Carlos Santos',
      email: 'carlos@santos.com',
      telefone: '912345678',
      morada: 'Rua A',
      distrito: 'Porto',
      veiculos: [{ marca: 'Audi', modelo: 'A4', ano: 2015, matricula: 'AA-11-BB' }],
      estado: 'ativo',
      origem: 'manual',
      criadoEm: dummyTimestamp,
      atualizadoEm: dummyTimestamp,
    },
  ];

  it('strategy "all" creates everything without checking duplicates', () => {
    const csvRows: ClientInput[] = [
      { nome: 'Carlos Santos', email: 'carlos@santos.com', estado: 'lead', origem: 'csv' },
      { nome: 'Carlos Santos', email: 'carlos@santos.com', estado: 'lead', origem: 'csv' },
    ];
    const { toCreate, toUpdate, skippedCount } = processClientsImport(csvRows, existingClients, 'all');
    expect(toCreate).toHaveLength(2);
    expect(toUpdate).toHaveLength(0);
    expect(skippedCount).toBe(0);
  });

  it('strategy "skip" ignores rows matching database emails and internal CSV duplicates', () => {
    const csvRows: ClientInput[] = [
      { nome: 'Novo Cliente', email: 'novo@email.com', estado: 'lead', origem: 'csv' },
      { nome: 'Carlos Santos', email: 'carlos@santos.com', estado: 'lead', origem: 'csv' }, // Db duplicate
      { nome: 'Novo Cliente Outro', email: 'novo@email.com', estado: 'lead', origem: 'csv' }, // CSV duplicate
    ];
    const { toCreate, toUpdate, skippedCount } = processClientsImport(csvRows, existingClients, 'skip');
    expect(toCreate).toHaveLength(1);
    expect(toCreate[0].nome).toBe('Novo Cliente');
    expect(toUpdate).toHaveLength(0);
    expect(skippedCount).toBe(2);
  });

  it('strategy "merge" merges CSV rows into DB matches and resolves internal duplicates', () => {
    const csvRows: ClientInput[] = [
      // 1. Matches DB: updates phone, address, appends new vehicle, merges notes
      {
        nome: 'Carlos Santos Jr',
        email: 'carlos@santos.com',
        telefone: '919999999',
        morada: 'Rua B',
        veiculos: [{ marca: 'BMW', modelo: '320d', ano: 2018, matricula: 'CC-22-DD' }],
        estado: 'lead',
        origem: 'csv',
        notas: 'Notas adicionais 1',
      },
      // 2. Matches DB again: merges notes and merges vehicle with same license plate but updated details
      {
        nome: 'Carlos Santos',
        email: 'carlos@santos.com',
        veiculos: [{ marca: 'BMW', modelo: '320d LCI', ano: 2019, matricula: 'CC-22-DD', notas: 'Notas do carro' }],
        estado: 'lead',
        origem: 'csv',
        notas: 'Notas adicionais 2',
      },
      // 3. New unique client
      {
        nome: 'Duarte',
        email: 'duarte@email.com',
        estado: 'lead',
        origem: 'csv',
      },
      // 4. Duplicate of unique client in same CSV batch: merges phone and vehicle
      {
        nome: 'Duarte Novo',
        email: 'duarte@email.com',
        telefone: '933333333',
        veiculos: [{ marca: 'Opel', modelo: 'Corsa' }],
        estado: 'lead',
        origem: 'csv',
        notas: 'Contacto por telefone',
      },
    ];

    const { toCreate, toUpdate, skippedCount } = processClientsImport(csvRows, existingClients, 'merge');

    expect(skippedCount).toBe(0);

    // Should create 1 new client (Duarte, with merged details from duplicate row)
    expect(toCreate).toHaveLength(1);
    expect(toCreate[0]).toMatchObject({
      nome: 'Duarte Novo',
      email: 'duarte@email.com',
      telefone: '933333333',
      notas: 'Contacto por telefone',
    });
    expect(toCreate[0].veiculos).toEqual([{ marca: 'Opel', modelo: 'Corsa' }]);

    // Should generate 1 update for Carlos
    expect(toUpdate).toHaveLength(1);
    expect(toUpdate[0].id).toBe('c1');
    expect(toUpdate[0].data.nome).toBe('Carlos Santos'); // from the second row it matched, it resolved back
    expect(toUpdate[0].data.telefone).toBe('919999999');
    expect(toUpdate[0].data.morada).toBe('Rua B');
    expect(toUpdate[0].data.notas).toBe('Notas adicionais 1\nNotas adicionais 2');

    // Vehicles of Carlos should have both Audi (existing) and BMW (merged and updated to 2019/LCI)
    expect(toUpdate[0].data.veiculos).toHaveLength(2);
    expect(toUpdate[0].data.veiculos?.[0]).toEqual({ marca: 'Audi', modelo: 'A4', ano: 2015, matricula: 'AA-11-BB' });
    expect(toUpdate[0].data.veiculos?.[1]).toEqual({
      marca: 'BMW',
      modelo: '320d LCI',
      ano: 2019,
      matricula: 'CC-22-DD',
      notas: 'Notas do carro',
    });
  });
});

