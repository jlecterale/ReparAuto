'use client';

import { useState, useMemo } from 'react';
import { Check, DownloadSimple, UploadSimple, Warning } from '@phosphor-icons/react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import { parseClientsCsv, buildClientsCsvTemplate, type ClientsCsvParseResult } from '@/lib/clientCsv';
import type { Client, ClientInput } from '@/types/client';

interface Props {
  show: boolean;
  onClose: () => void;
  clients: Client[];
  onImport: (
    list: ClientInput[],
    strategy: 'skip' | 'merge' | 'all'
  ) => Promise<{ createdCount: number; updatedCount: number }>;
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

export default function ClientCsvImport({ show, onClose, clients, onImport }: Props) {
  const toast = useToast();
  const [parsed, setParsed] = useState<ClientsCsvParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [strategy, setStrategy] = useState<'skip' | 'merge' | 'all'>('skip');

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setParsed(parseClientsCsv(text));
  };

  const analysis = useMemo(() => {
    if (!parsed || parsed.rows.length === 0) return null;

    const existingEmails = new Set(
      clients.map((c) => c.email?.trim().toLowerCase()).filter(Boolean) as string[]
    );

    let duplicatesInCsv = 0;
    let matchesInDb = 0;
    const seenEmails = new Set<string>();

    parsed.rows.forEach((row) => {
      const email = row.email?.trim().toLowerCase();
      if (!email) return;

      if (seenEmails.has(email)) {
        duplicatesInCsv++;
      } else {
        seenEmails.add(email);
        if (existingEmails.has(email)) {
          matchesInDb++;
        }
      }
    });

    const totalDuplicates = duplicatesInCsv + matchesInDb;

    return {
      total: parsed.rows.length,
      duplicatesInCsv,
      matchesInDb,
      totalDuplicates,
    };
  }, [parsed, clients]);

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    try {
      const { createdCount, updatedCount } = await onImport(parsed.rows, strategy);
      let msg = '';
      if (createdCount > 0 && updatedCount > 0) {
        msg = `${createdCount} cliente(s) criado(s) e ${updatedCount} atualizado(s).`;
      } else if (createdCount > 0) {
        msg = `${createdCount} cliente(s) criado(s).`;
      } else if (updatedCount > 0) {
        msg = `${updatedCount} cliente(s) atualizado(s).`;
      } else {
        msg = 'Nenhum cliente novo foi importado.';
      }
      toast?.sucesso(msg);
      setParsed(null);
      setStrategy('skip');
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
          <div className="space-y-3">
            <Alert tipo={parsed.rows.length > 0 ? 'sucesso' : 'aviso'} className="!p-3 !rounded-lg">
              {parsed.rows.length} cliente{parsed.rows.length !== 1 ? 's' : ''} prontos a importar.
            </Alert>

            {analysis && analysis.totalDuplicates > 0 && (
              <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-4 space-y-3">
                <div className="flex items-start gap-2 text-amber-600">
                  <Warning size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-fg-heading">Emails repetidos detetados</p>
                    <p className="text-xs text-fg-muted">
                      Encontrámos {analysis.totalDuplicates} email(s) duplicados (
                      {analysis.matchesInDb} já existem na sua base de dados e {analysis.duplicatesInCsv} estão repetidos no ficheiro).
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="strategy"
                      value="skip"
                      checked={strategy === 'skip'}
                      onChange={() => setStrategy('skip')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-fg-heading">Ignorar duplicados</span>
                      <p className="text-xs text-fg-muted">Importa apenas novos clientes. Os duplicados não serão carregados.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="strategy"
                      value="merge"
                      checked={strategy === 'merge'}
                      onChange={() => setStrategy('merge')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-fg-heading">Fundir/Atualizar existentes</span>
                      <p className="text-xs text-fg-muted">Associa os dados aos clientes existentes (mesmo email) e atualiza-os.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="strategy"
                      value="all"
                      checked={strategy === 'all'}
                      onChange={() => setStrategy('all')}
                      className="mt-1"
                    />
                    <div>
                      <span className="font-semibold text-fg-heading">Importar tudo</span>
                      <p className="text-xs text-fg-muted">Cria novos registos para tudo, mesmo que fiquem duplicados.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

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
