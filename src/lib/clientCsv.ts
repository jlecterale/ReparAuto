import { CLIENT_CSV_HEADERS } from '@/lib/constants';
import type { Client, ClientInput } from '@/types/client';


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

export interface ImportMergeResult {
  toCreate: ClientInput[];
  toUpdate: { id: string; data: Partial<Client> }[];
  skippedCount: number;
}

/**
 * Processes parsed CSV rows against existing clients based on the chosen strategy:
 * - 'all': imports everything as new clients, creating duplicates.
 * - 'skip': ignores any row whose email matches an existing client or is duplicated in the CSV.
 * - 'merge': merges fields and vehicles for rows matching existing clients by email, and
 *            combines duplicate rows within the CSV itself into a single client record.
 */
export function processClientsImport(
  csvRows: ClientInput[],
  existingClients: Client[],
  strategy: 'skip' | 'merge' | 'all'
): ImportMergeResult {
  if (strategy === 'all') {
    return {
      toCreate: csvRows,
      toUpdate: [],
      skippedCount: 0,
    };
  }

  const toCreate: ClientInput[] = [];
  const toUpdate: { id: string; data: Partial<Client> }[] = [];
  let skippedCount = 0;

  // Track emails we've already processed in this import batch
  const processedEmails = new Set<string>();
  const createdEmailToIdx = new Map<string, number>();
  const updatedEmailToIdx = new Map<string, number>();

  // Map existing clients by email for fast lookup
  const existingByEmail = new Map<string, Client>();
  existingClients.forEach((c) => {
    if (c.email) {
      existingByEmail.set(c.email.trim().toLowerCase(), c);
    }
  });

  const cleanPlate = (p?: string) => (p || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  for (const row of csvRows) {
    const email = row.email?.trim().toLowerCase();

    if (!email) {
      // No email: cannot detect duplicate, always create
      toCreate.push(row);
      continue;
    }

    const hasExisting = existingByEmail.has(email);
    const hasProcessedInBatch = processedEmails.has(email);

    if (hasExisting || hasProcessedInBatch) {
      if (strategy === 'skip') {
        skippedCount++;
        processedEmails.add(email);
        continue;
      }

      if (strategy === 'merge') {
        if (hasExisting) {
          const existing = existingByEmail.get(email)!;
          const existingUpdateIdx = updatedEmailToIdx.get(email);

          if (existingUpdateIdx !== undefined) {
            // Merge this row into the already pending update
            const pending = toUpdate[existingUpdateIdx];
            if (row.nome) pending.data.nome = row.nome;
            if (row.telefone) pending.data.telefone = row.telefone;
            if (row.morada) pending.data.morada = row.morada;
            if (row.distrito) pending.data.distrito = row.distrito;
            if (row.notas) {
              pending.data.notas = pending.data.notas
                ? `${pending.data.notas}\n${row.notas}`
                : row.notas;
            }

            if (row.veiculos && row.veiculos.length > 0) {
              const currentVehicles = pending.data.veiculos || existing.veiculos || [];
              const merged = [...currentVehicles];
              row.veiculos.forEach((newV) => {
                const dupIdx = merged.findIndex(
                  (v) =>
                    (v.matricula && newV.matricula && cleanPlate(v.matricula) === cleanPlate(newV.matricula)) ||
                    (!v.matricula && !newV.matricula && v.marca.toLowerCase() === newV.marca.toLowerCase() && v.modelo.toLowerCase() === newV.modelo.toLowerCase())
                );
                if (dupIdx >= 0) {
                  merged[dupIdx] = {
                    ...merged[dupIdx],
                    ...newV,
                    notas: merged[dupIdx].notas && newV.notas
                      ? `${merged[dupIdx].notas}\n${newV.notas}`
                      : (newV.notas || merged[dupIdx].notas),
                  };
                } else {
                  merged.push(newV);
                }
              });
              pending.data.veiculos = merged;
            }
          } else {
            // Create a new pending update
            const updateData: Partial<Client> = {};
            if (row.nome && row.nome !== existing.nome) updateData.nome = row.nome;
            if (row.telefone && row.telefone !== existing.telefone) updateData.telefone = row.telefone;
            if (row.morada && row.morada !== existing.morada) updateData.morada = row.morada;
            if (row.distrito && row.distrito !== existing.distrito) updateData.distrito = row.distrito;
            if (row.notas) {
              updateData.notas = existing.notas ? `${existing.notas}\n${row.notas}` : row.notas;
            }

            if (row.veiculos && row.veiculos.length > 0) {
              const merged = [...(existing.veiculos || [])];
              row.veiculos.forEach((newV) => {
                const dupIdx = merged.findIndex(
                  (v) =>
                    (v.matricula && newV.matricula && cleanPlate(v.matricula) === cleanPlate(newV.matricula)) ||
                    (!v.matricula && !newV.matricula && v.marca.toLowerCase() === newV.marca.toLowerCase() && v.modelo.toLowerCase() === newV.modelo.toLowerCase())
                );
                if (dupIdx >= 0) {
                  merged[dupIdx] = {
                    ...merged[dupIdx],
                    ...newV,
                    notas: merged[dupIdx].notas && newV.notas
                      ? `${merged[dupIdx].notas}\n${newV.notas}`
                      : (newV.notas || merged[dupIdx].notas),
                  };
                } else {
                  merged.push(newV);
                }
              });
              updateData.veiculos = merged;
            }

            toUpdate.push({ id: existing.id, data: updateData });
            updatedEmailToIdx.set(email, toUpdate.length - 1);
          }
        } else {
          // It's a duplicate of a row we already added to `toCreate` in this batch
          const createIdx = createdEmailToIdx.get(email)!;
          const pending = toCreate[createIdx];

          if (row.nome) pending.nome = row.nome;
          if (row.telefone) pending.telefone = row.telefone;
          if (row.morada) pending.morada = row.morada;
          if (row.distrito) pending.distrito = row.distrito;
          if (row.notas) {
            pending.notas = pending.notas ? `${pending.notas}\n${row.notas}` : row.notas;
          }

          if (row.veiculos && row.veiculos.length > 0) {
            const merged = [...(pending.veiculos || [])];
            row.veiculos.forEach((newV) => {
              const dupIdx = merged.findIndex(
                (v) =>
                  (v.matricula && newV.matricula && cleanPlate(v.matricula) === cleanPlate(newV.matricula)) ||
                  (!v.matricula && !newV.matricula && v.marca.toLowerCase() === newV.marca.toLowerCase() && v.modelo.toLowerCase() === newV.modelo.toLowerCase())
              );
              if (dupIdx >= 0) {
                merged[dupIdx] = {
                  ...merged[dupIdx],
                  ...newV,
                  notas: merged[dupIdx].notas && newV.notas
                    ? `${merged[dupIdx].notas}\n${newV.notas}`
                    : (newV.notas || merged[dupIdx].notas),
                };
              } else {
                merged.push(newV);
              }
            });
            pending.veiculos = merged;
          }
        }
      }
    } else {
      // Unique email in batch and database
      toCreate.push(row);
      createdEmailToIdx.set(email, toCreate.length - 1);
    }

    processedEmails.add(email);
  }

  return { toCreate, toUpdate, skippedCount };
}

