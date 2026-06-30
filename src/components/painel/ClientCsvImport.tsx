'use client';

import { useState } from 'react';
import { Check, DownloadSimple, UploadSimple, Warning } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { CLIENT_CSV_HEADERS } from '@/lib/constants';
import type { ClientInput } from '@/types/client';

interface Props {
  show: boolean;
  onClose: () => void;
  onImport: (list: ClientInput[]) => Promise<number>;
}

interface ParseResult {
  rows: ClientInput[];
  errors: string[];
}

/** Splits one CSV line honouring double-quoted fields (which may contain the delimiter). */
function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function parseCsv(text: string): ParseResult {
  // Strip a UTF-8 BOM (Excel/Numbers prepend one) so the first header matches.
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const rows: ClientInput[] = [];
  const errors: string[] = [];
  if (lines.length < 2) {
    errors.push('O ficheiro precisa de uma linha de cabeçalho e pelo menos uma linha de dados.');
    return { rows, errors };
  }
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i], delimiter);
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

function downloadTemplate() {
  const header = CLIENT_CSV_HEADERS.join(',');
  const example = 'João Silva,joao@exemplo.pt,912345678,Rua A 1,Porto,VW,Golf,2018,00-AA-00,Cliente desde 2020';
  const blob = new Blob([`${header}\n${example}\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clientes-modelo.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClientCsvImport({ show, onClose, onImport }: Props) {
  const toast = useToast();
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setParsed(parseCsv(text));
  };

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    try {
      const n = await onImport(parsed.rows);
      toast?.sucesso(`${n} cliente${n !== 1 ? 's' : ''} importado${n !== 1 ? 's' : ''}.`);
      setParsed(null);
      onClose();
    } catch {
      toast?.erro('Erro ao importar. Tente novamente.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo="Importar clientes (CSV)" tamanho="md">
      <div className="space-y-4">
        <p className="text-sm text-fg-muted">
          Carregue um ficheiro CSV com os seus clientes. Use o modelo para garantir as colunas certas.
          É responsável pelos dados que carrega — só os adicione com base legal (RGPD).
        </p>

        <Button tipo="terciario" tamanho="sm" icone={<DownloadSimple />} onClick={downloadTemplate}>
          Descarregar modelo CSV
        </Button>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-neutral-300 rounded-xl py-8 cursor-pointer hover:border-accent hover:bg-accent/5 transition">
          <UploadSimple size={28} className="text-fg-subtle" />
          <span className="text-sm font-semibold text-fg">Escolher ficheiro .csv</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
        </label>

        {parsed && (
          <div className="space-y-2">
            <Alert tipo={parsed.rows.length > 0 ? 'sucesso' : 'aviso'} className="!p-3 !rounded-lg">
              {parsed.rows.length} cliente{parsed.rows.length !== 1 ? 's' : ''} prontos a importar.
            </Alert>
            {parsed.errors.length > 0 && (
              <div className="text-xs text-warning-700 space-y-0.5 max-h-32 overflow-y-auto">
                {parsed.errors.map((e, i) => (
                  <p key={i} className="inline-flex items-center gap-1">
                    <Warning weight="fill" /> {e}
                  </p>
                ))}
              </div>
            )}
            {parsed.rows.length > 0 && (
              <Button
                tipo="primario"
                tamanho="lg"
                blocoCompleto
                icone={<Check />}
                onClick={handleImport}
                disabled={importing}
                carregando={importing}
              >
                Importar {parsed.rows.length} cliente{parsed.rows.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
