import { CLIENT_CSV_HEADERS } from '@/lib/constants';
import type { ClientInput } from '@/types/client';

export interface ClientsCsvParseResult {
  rows: ClientInput[];
  errors: string[];
}

/**
 * Splits CSV text into records of cells, honouring double-quoted fields — which
 * may contain the delimiter, escaped quotes ("") and line breaks (RFC 4180).
 * CRLF is normalised to LF inside quoted fields.
 */
function splitCsvRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cur = '';
  let inQuotes = false;

  const endField = () => {
    record.push(cur.trim());
    cur = '';
  };
  const endRecord = () => {
    endField();
    // Skip blank lines (e.g. the trailing newline Excel appends).
    if (record.some((c) => c.length > 0)) records.push(record);
    record = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else if (ch === '\r' && text[i + 1] === '\n') {
        cur += '\n';
        i++;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      endField();
    } else if (ch === '\n') {
      endRecord();
    } else if (ch !== '\r') {
      cur += ch;
    }
  }
  endRecord();
  return records;
}

/**
 * Parses a client CSV export (comma or semicolon delimited, optional UTF-8 BOM,
 * double-quoted fields possibly spanning lines) into ClientInput rows. Rows
 * without a name are skipped and reported in `errors` with their record number.
 */
export function parseClientsCsv(text: string): ClientsCsvParseResult {
  // Strip a UTF-8 BOM (Excel/Numbers prepend one) so the first header matches.
  const clean = text.replace(/^﻿/, '');
  const rows: ClientInput[] = [];
  const errors: string[] = [];
  const firstLine = clean.slice(0, clean.indexOf('\n') === -1 ? undefined : clean.indexOf('\n'));
  const delimiter = firstLine.includes(';') ? ';' : ',';
  const records = splitCsvRecords(clean, delimiter);
  if (records.length < 2) {
    errors.push('O ficheiro precisa de uma linha de cabeçalho e pelo menos uma linha de dados.');
    return { rows, errors };
  }
  const headers = records[0].map((h) => h.toLowerCase());

  for (let i = 1; i < records.length; i++) {
    const cells = records[i];
    const get = (key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? cells[idx] || '' : '';
    };
    const nome = get('nome');
    if (!nome) {
      errors.push(`Linha ${i + 1}: nome em falta — ignorada.`);
      continue;
    }
    const marca = get('marca');
    const modelo = get('modelo');
    const anoRaw = get('ano');
    const ano = anoRaw && /^\d{4}$/.test(anoRaw) ? Number(anoRaw) : undefined;
    const veiculos =
      marca || modelo
        ? [{ marca, modelo, ano, matricula: get('matricula') || undefined }]
        : undefined;
    rows.push({
      nome,
      email: get('email') || undefined,
      telefone: get('telefone') || undefined,
      morada: get('morada') || undefined,
      distrito: get('distrito') || undefined,
      estado: 'lead',
      origem: 'csv',
      veiculos,
      notas: get('notas') || undefined,
    });
  }
  return { rows, errors };
}

/** Builds the downloadable CSV template (header + one example row). */
export function buildClientsCsvTemplate(): string {
  const header = CLIENT_CSV_HEADERS.join(',');
  const example = 'João Silva,joao@exemplo.pt,912345678,Rua A 1,Porto,VW,Golf,2018,00-AA-00,Cliente desde 2020';
  return `${header}\n${example}\n`;
}
