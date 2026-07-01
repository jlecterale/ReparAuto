'use client';

import { useState } from 'react';
import { Check, DownloadSimple, UploadSimple, Warning } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { parseClientsCsv, buildClientsCsvTemplate, type ClientsCsvParseResult } from '@/lib/clientCsv';
import type { ClientInput } from '@/types/client';

interface Props {
  show: boolean;
  onClose: () => void;
  onImport: (list: ClientInput[]) => Promise<number>;
}

function downloadTemplate() {
  const blob = new Blob([buildClientsCsvTemplate()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clientes-modelo.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClientCsvImport({ show, onClose, onImport }: Props) {
  const toast = useToast();
  const [parsed, setParsed] = useState<ClientsCsvParseResult | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setParsed(parseClientsCsv(text));
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
