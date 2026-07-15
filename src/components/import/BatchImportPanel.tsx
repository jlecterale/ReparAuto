'use client';

import {
  ArrowCounterClockwise,
  CheckCircle,
  CircleNotch,
  DownloadSimple,
  FileArrowUp,
  MagnifyingGlass,
  Plus,
  Prohibit,
  Storefront,
  Trash,
  XCircle,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getCarrosByCreator } from '@/lib/db';
import {
  discoverStandvirtualInventory,
  importErrorMessage,
  importStandvirtualAdvert,
} from '@/lib/importers/client';
import {
  MAX_IMPORT_BATCH_SIZE,
  extractUrlsFromText,
  validateStandvirtualInventoryUrl,
  validateStandvirtualUrl,
} from '@/lib/importers/urlList';

type Phase = 'edit' | 'running' | 'done';

interface RowStatus {
  kind: 'empty' | 'invalid' | 'repeated' | 'exists' | 'valid';
  reason?: string;
  adId?: string;
  normalizedUrl?: string;
  carId?: string;
}

interface RunResult {
  state: 'waiting' | 'importing' | 'created' | 'duplicate' | 'blocked' | 'failed' | 'skipped';
  carId?: string;
  message?: string;
  unmappedCount?: number;
}

const TEMPLATE_URLS = [
  'https://www.standvirtual.com/carros/anuncio/exemplo-um-ID000AAA.html',
  'https://www.standvirtual.com/carros/anuncio/exemplo-dois-ID000BBB.html',
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function downloadTemplate(kind: 'txt' | 'csv') {
  const content = kind === 'csv' ? ['url', ...TEMPLATE_URLS].join('\n') : TEMPLATE_URLS.join('\n');
  const blob = new Blob([content], { type: kind === 'csv' ? 'text/csv' : 'text/plain' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `importar-standvirtual.${kind}`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

/**
 * "Importar vários" — the user assembles a list of advert URLs (rows, paste
 * box or .txt/.csv file), sees each one validated, and the batch is imported
 * SERIALLY (one request at a time, 0.8–2s apart) as 'pendente' drafts.
 */
export default function BatchImportPanel({ attested }: { attested: boolean }) {
  const router = useRouter();
  const { auth } = useApp();
  const { user } = auth;
  const toast = useToast();

  const [rows, setRows] = useState<string[]>(['']);
  const [pasteText, setPasteText] = useState('');
  const [phase, setPhase] = useState<Phase>('edit');
  const [results, setResults] = useState<Record<number, RunResult>>({});
  const [blockedStop, setBlockedStop] = useState(false);
  const [fatalStop, setFatalStop] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importedIds, setImportedIds] = useState<Map<string, string>>(new Map());
  const [standUrl, setStandUrl] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const cancelRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Adverts this user already imported (by origemId) — flagged before import.
  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    getCarrosByCreator(user.email)
      .then((cars) => {
        if (!active) return;
        const map = new Map<string, string>();
        for (const car of cars) {
          if (car.origem === 'standvirtual' && car.origemId) map.set(car.origemId, car.id);
        }
        setImportedIds(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.email]);

  const rowStatuses = useMemo<RowStatus[]>(() => {
    const firstIndexByAdId = new Map<string, number>();
    return rows.map((raw, index) => {
      const trimmed = raw.trim();
      if (!trimmed) return { kind: 'empty' as const };
      const parsed = validateStandvirtualUrl(trimmed);
      if (!parsed.valid || !parsed.adId) return { kind: 'invalid' as const, reason: parsed.reason };
      if (firstIndexByAdId.has(parsed.adId)) return { kind: 'repeated' as const, adId: parsed.adId };
      firstIndexByAdId.set(parsed.adId, index);
      const existingCarId = importedIds.get(parsed.adId);
      if (existingCarId) {
        return { kind: 'exists' as const, adId: parsed.adId, carId: existingCarId };
      }
      return { kind: 'valid' as const, adId: parsed.adId, normalizedUrl: parsed.normalizedUrl };
    });
  }, [rows, importedIds]);

  const validCount = rowStatuses.filter((status) => status.kind === 'valid').length;
  const invalidCount = rowStatuses.filter((status) => status.kind === 'invalid').length;
  const existsCount = rowStatuses.filter((status) => status.kind === 'exists').length;
  const overCap = validCount > MAX_IMPORT_BATCH_SIZE;

  const appendUrls = (text: string) => {
    const found = extractUrlsFromText(text);
    if (found.length === 0) {
      toast?.erro('Não foi encontrado nenhum URL do Standvirtual.');
      return;
    }
    const existing = new Set(rows.map((row) => row.trim()).filter(Boolean));
    const fresh = [...new Set(found)].filter((url) => !existing.has(url));
    if (fresh.length === 0) {
      toast?.info('Todos os URLs já estavam na lista.');
      return;
    }
    setRows((prev) => [...prev.filter((row) => row.trim()), ...fresh]);
    toast?.info(`${fresh.length} URL${fresh.length === 1 ? '' : 's'} adicionado${fresh.length === 1 ? '' : 's'} à lista.`);
  };

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast?.erro('Ficheiro demasiado grande (máx. 1 MB).');
      return;
    }
    appendUrls(await file.text());
  };

  const startImport = async () => {
    setPhase('running');
    cancelRef.current = false;
    setBlockedStop(false);
    setFatalStop(null);

    const queue = rowStatuses
      .map((status, index) => ({ status, index }))
      .filter((entry) => entry.status.kind === 'valid');
    const progress: Record<number, RunResult> = {};
    for (const entry of queue) progress[entry.index] = { state: 'waiting' };
    setResults({ ...progress });

    let stopped = false;
    for (const { status, index } of queue) {
      if (cancelRef.current || stopped) {
        progress[index] = { state: 'skipped' };
        setResults({ ...progress });
        continue;
      }
      progress[index] = { state: 'importing' };
      setResults({ ...progress });

      let result = await importStandvirtualAdvert(status.normalizedUrl!);
      if (result.status === 'rate_limited') {
        // Our own per-user limit — wait it out once, politely, then retry.
        await sleep(Math.min(result.retryAfterSeconds, 90) * 1000);
        if (!cancelRef.current) result = await importStandvirtualAdvert(status.normalizedUrl!);
      }

      if (result.status === 'created') {
        progress[index] = {
          state: 'created',
          carId: result.carId,
          unmappedCount: result.unmappedFields.length,
        };
        if (status.adId) setImportedIds((prev) => new Map(prev).set(status.adId!, result.carId));
      } else if (result.status === 'duplicate') {
        progress[index] = { state: 'duplicate', carId: result.carId };
      } else if (result.status === 'blocked') {
        // Anti-bot challenge: stop gracefully, no aggressive retries.
        progress[index] = { state: 'blocked' };
        setBlockedStop(true);
        stopped = true;
      } else if (result.status === 'rate_limited') {
        progress[index] = { state: 'failed', message: importErrorMessage('rate_limited') };
      } else {
        progress[index] = { state: 'failed', message: result.message };
        if (result.fatal) {
          setFatalStop(result.message);
          stopped = true;
        }
      }
      setResults({ ...progress });

      const isLast = index === queue[queue.length - 1].index;
      if (!isLast && !cancelRef.current && !stopped) {
        await sleep(800 + Math.random() * 1200); // anti-bot pacing between items
      }
    }
    setPhase('done');
  };

  const summary = useMemo(() => {
    const values = Object.values(results);
    return {
      created: values.filter((r) => r.state === 'created').length,
      duplicates: values.filter((r) => r.state === 'duplicate').length,
      failed: values.filter((r) => r.state === 'failed' || r.state === 'blocked').length,
      skipped: values.filter((r) => r.state === 'skipped').length,
    };
  }, [results]);

  const statusChip = (status: RowStatus, index: number) => {
    const run = results[index];
    if (phase !== 'edit' && run) {
      switch (run.state) {
        case 'waiting':
          return <Badge cor="gray">Na fila</Badge>;
        case 'importing':
          return (
            <Badge cor="accent">
              <CircleNotch className="animate-spin" /> A importar…
            </Badge>
          );
        case 'created':
          return (
            <span className="inline-flex items-center gap-1.5">
              <Badge cor="green">Criado</Badge>
              {run.carId && (
                <Link href={`/detalhes/${run.carId}`} className="text-xs font-semibold text-fg-link hover:underline">
                  Rever
                </Link>
              )}
            </span>
          );
        case 'duplicate':
          return <Badge cor="blue">Já existia</Badge>;
        case 'blocked':
          return <Badge cor="yellow">Bloqueado</Badge>;
        case 'skipped':
          return <Badge cor="gray">Não processado</Badge>;
        case 'failed':
          return <Badge cor="red">Falhou</Badge>;
      }
    }
    switch (status.kind) {
      case 'empty':
        return null;
      case 'invalid':
        return <Badge cor="red">Inválido</Badge>;
      case 'repeated':
        return <Badge cor="gray">Repetido</Badge>;
      case 'exists':
        return (
          <span className="inline-flex items-center gap-1.5">
            <Badge cor="blue">Já importado</Badge>
            {status.carId && (
              <Link href={`/detalhes/${status.carId}`} className="text-xs font-semibold text-fg-link hover:underline">
                Ver
              </Link>
            )}
          </span>
        );
      case 'valid':
        return <Badge cor="green">Válido</Badge>;
    }
  };

  const editing = phase === 'edit';
  const isProfessional = user?.tipoConta === 'profissional';
  const isVerifiedProfessional = isProfessional && user?.verificado === true;

  const handleDiscoverInventory = async () => {
    setDiscoverError('');
    const parsed = validateStandvirtualInventoryUrl(standUrl);
    if (!parsed.valid || !parsed.normalizedUrl) {
      setDiscoverError(parsed.reason || 'URL inválido.');
      return;
    }
    setDiscovering(true);
    try {
      const result = await discoverStandvirtualInventory(parsed.normalizedUrl);
      if (!result.ok) {
        setDiscoverError(result.message);
        return;
      }
      if (result.urls.length === 0) {
        setDiscoverError('Nenhum anúncio publicado encontrado nesta página de stand.');
        return;
      }
      appendUrls(result.urls.join('\n'));
      if (result.truncated) {
        toast?.info(
          'Lista parcial — o stand tem mais anúncios do que foi possível ler agora. Repita mais tarde para os restantes.',
        );
      }
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-fg">
        Junte os links dos seus anúncios (até {MAX_IMPORT_BATCH_SIZE} de cada vez). Cada anúncio é
        criado como <strong>rascunho pendente</strong> — revê-os depois em Perfil → Os Seus Carros
        Anunciados.
      </p>

      {/* Whole-stand discovery — professionals with validated documentation */}
      {editing && isProfessional && (
        <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
          <p className="text-sm font-bold text-fg-heading flex items-center gap-1.5 mb-1">
            <Storefront className="text-primary-600" /> Importar o stand inteiro
          </p>
          {isVerifiedProfessional ? (
            <>
              <p className="text-xs text-fg-muted mb-2">
                Cole o endereço da página do seu stand no Standvirtual (ex.:{' '}
                <span className="font-mono">omeustand.standvirtual.com</span>) — os anúncios
                publicados são adicionados à lista abaixo para rever e importar.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={standUrl}
                  onChange={(e) => {
                    setStandUrl(e.target.value);
                    setDiscoverError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !discovering && standUrl.trim()) {
                      void handleDiscoverInventory();
                    }
                  }}
                  placeholder="https://omeustand.standvirtual.com/inventory"
                  aria-label="URL da página do stand"
                  disabled={discovering}
                  className={`flex-1 min-w-0 rounded-xl border px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-slate-100 disabled:text-fg-subtle ${
                    discoverError ? 'border-danger-300' : 'border-slate-300 focus:border-accent'
                  }`}
                />
                <Button
                  tipo="azul"
                  tamanho="sm"
                  icone={<MagnifyingGlass weight="bold" />}
                  carregando={discovering}
                  disabled={discovering || !standUrl.trim()}
                  onClick={handleDiscoverInventory}
                  className="shrink-0"
                >
                  {discovering ? 'A procurar…' : 'Procurar anúncios'}
                </Button>
              </div>
              {discoverError && <p className="text-xs text-danger-600 mt-1">{discoverError}</p>}
            </>
          ) : (
            <p className="text-xs text-fg-muted">
              Disponível para contas profissionais com <strong>documentação validada</strong>.{' '}
              <Link href="/perfil" className="text-fg-link font-semibold hover:underline">
                Peça a verificação no Perfil
              </Link>{' '}
              para desbloquear.
            </p>
          )}
        </div>
      )}

      {/* URL rows */}
      <div className="space-y-2" aria-live="polite">
        {rows.map((row, index) => {
          const status = rowStatuses[index];
          return (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <input
                  type="url"
                  value={row}
                  disabled={!editing}
                  onChange={(e) =>
                    setRows((prev) => prev.map((r, i) => (i === index ? e.target.value : r)))
                  }
                  placeholder="https://www.standvirtual.com/carros/anuncio/…-ID….html"
                  aria-label={`URL do anúncio ${index + 1}`}
                  className={`w-full rounded-xl border px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-slate-100 disabled:text-fg-subtle ${
                    status.kind === 'invalid' ? 'border-danger-300' : 'border-slate-300 focus:border-accent'
                  }`}
                />
                {status.kind === 'invalid' && status.reason && (
                  <p className="text-xs text-danger-600 mt-1">{status.reason}</p>
                )}
                {results[index]?.state === 'failed' && results[index].message && (
                  <p className="text-xs text-danger-600 mt-1">{results[index].message}</p>
                )}
                {results[index]?.state === 'created' && (results[index].unmappedCount ?? 0) > 0 && (
                  <p className="text-xs text-warning-700 mt-1">
                    Criado com {results[index].unmappedCount} campo(s) por rever.
                  </p>
                )}
              </div>
              <div className="shrink-0 pt-1.5 flex items-center gap-2">
                {statusChip(status, index)}
                {editing && (
                  <button
                    type="button"
                    onClick={() => setRows((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)))}
                    aria-label={`Remover URL ${index + 1}`}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition"
                  >
                    <Trash />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {editing && (
          <Button tipo="terciario" tamanho="sm" icone={<Plus weight="bold" />} onClick={() => setRows((prev) => [...prev, ''])}>
            Adicionar URL
          </Button>
        )}
      </div>

      {editing && (
        <>
          {/* Paste many */}
          <div>
            <label htmlFor="paste-many" className="block text-xs font-bold text-fg mb-1.5">
              Colar vários de uma vez
            </label>
            <textarea
              id="paste-many"
              rows={3}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Um URL por linha (também aceita separados por vírgulas ou espaços)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
            <Button
              tipo="secundario"
              tamanho="sm"
              className="mt-2"
              disabled={!pasteText.trim()}
              onClick={() => {
                appendUrls(pasteText);
                setPasteText('');
              }}
            >
              Adicionar à lista
            </Button>
          </div>

          {/* File drop */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-xl border-2 border-dashed p-5 text-center transition ${
              dragOver ? 'border-accent bg-orange-50/40' : 'border-slate-300 bg-slate-50'
            }`}
          >
            <FileArrowUp size={28} className="text-fg-muted mx-auto mb-2" />
            <p className="text-sm text-fg mb-2">
              Arraste um ficheiro <strong>.txt</strong> ou <strong>.csv</strong> com os URLs, ou
            </p>
            <Button tipo="secundario" tamanho="sm" onClick={() => fileInputRef.current?.click()}>
              Escolher ficheiro
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div className="flex items-center justify-center gap-4 mt-3">
              <button
                type="button"
                onClick={() => downloadTemplate('txt')}
                className="text-xs font-semibold text-fg-link hover:underline inline-flex items-center gap-1"
              >
                <DownloadSimple /> Modelo .txt
              </button>
              <button
                type="button"
                onClick={() => downloadTemplate('csv')}
                className="text-xs font-semibold text-fg-link hover:underline inline-flex items-center gap-1"
              >
                <DownloadSimple /> Modelo .csv
              </button>
            </div>
          </div>

          {/* Validation summary + cap */}
          {(validCount > 0 || invalidCount > 0 || existsCount > 0) && (
            <p className="text-xs text-fg-muted">
              {validCount} válido{validCount === 1 ? '' : 's'}
              {existsCount > 0 && ` · ${existsCount} já importado${existsCount === 1 ? '' : 's'}`}
              {invalidCount > 0 && ` · ${invalidCount} inválido${invalidCount === 1 ? '' : 's'}`}
            </p>
          )}
          {overCap && (
            <Alert tipo="aviso" titulo={`Máximo de ${MAX_IMPORT_BATCH_SIZE} anúncios por lote`}>
              Tem {validCount} URLs válidos. Remova {validCount - MAX_IMPORT_BATCH_SIZE} da lista ou
              divida a importação em vários lotes — nada é cortado automaticamente.
            </Alert>
          )}

          <Button
            tipo="primario"
            blocoCompleto
            icone={<DownloadSimple weight="bold" />}
            disabled={!attested || validCount === 0 || overCap}
            onClick={startImport}
          >
            {validCount > 0
              ? `Importar ${validCount} anúncio${validCount === 1 ? '' : 's'}`
              : 'Importar anúncios'}
          </Button>
          {!attested && (
            <p className="text-xs text-fg-muted text-center">
              Confirme acima que os anúncios são seus para continuar.
            </p>
          )}
        </>
      )}

      {phase === 'running' && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-fg-muted inline-flex items-center gap-2">
            <CircleNotch className="animate-spin text-accent" /> A importar um a um para não
            sobrecarregar o Standvirtual…
          </p>
          <Button
            tipo="secundario"
            tamanho="sm"
            icone={<Prohibit />}
            onClick={() => {
              cancelRef.current = true;
            }}
          >
            Cancelar restantes
          </Button>
        </div>
      )}

      {phase === 'done' && (
        <div className="space-y-3">
          {blockedStop && (
            <Alert tipo="aviso" titulo="Importação interrompida" icone={<Prohibit size={18} />}>
              O Standvirtual bloqueou temporariamente a leitura automática. Os anúncios já criados
              ficaram guardados — tente importar os restantes mais tarde.
            </Alert>
          )}
          {fatalStop && (
            <Alert tipo="erro" titulo="Importação interrompida" icone={<XCircle size={18} />}>
              {fatalStop}
            </Alert>
          )}
          <Alert
            tipo={summary.created > 0 ? 'sucesso' : 'neutro'}
            titulo="Resumo da importação"
            icone={<CheckCircle size={18} />}
          >
            {summary.created} criado{summary.created === 1 ? '' : 's'} · {summary.duplicates} já
            existia{summary.duplicates === 1 ? '' : 'm'} · {summary.failed} falhou
            {summary.failed === 1 ? '' : 'aram'}
            {summary.skipped > 0 && ` · ${summary.skipped} não processado${summary.skipped === 1 ? '' : 's'}`}
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button tipo="primario" tamanho="sm" onClick={() => router.push('/perfil')}>
              Ver os meus anúncios
            </Button>
            <Button
              tipo="secundario"
              tamanho="sm"
              icone={<ArrowCounterClockwise />}
              onClick={() => {
                setPhase('edit');
                setResults({});
                setBlockedStop(false);
                setFatalStop(null);
              }}
            >
              Importar mais
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
