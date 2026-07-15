'use client';

import { CheckCircle, CircleNotch, MagnifyingGlass, Prohibit, Storefront } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
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
  extractStandvirtualAdId,
  validateStandvirtualInventoryUrl,
} from '@/lib/importers/urlList';
import type { Usuario } from '@/types/usuario';

type Phase = 'input' | 'review' | 'running' | 'done';

interface ItemState {
  url: string;
  adId: string;
  alreadyImported: boolean;
  result?: 'importing' | 'created' | 'duplicate' | 'blocked' | 'skipped' | 'failed';
  message?: string;
  carId?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Admin tool (PR #78 discussion): imports a client's whole Standvirtual
 * inventory INTO THE CLIENT'S account. Re-running it later acts as a sync —
 * new adverts are created, already-imported ones are skipped (origemId).
 */
export default function ImportInventoryModal({
  user,
  onClose,
}: {
  user: Usuario | null;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('input');
  const [standUrl, setStandUrl] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [erro, setErro] = useState('');
  const [discovering, setDiscovering] = useState(false);
  const [items, setItems] = useState<ItemState[]>([]);
  const [truncated, setTruncated] = useState(false);
  const cancelRef = useRef(false);

  // Fresh modal per target user.
  useEffect(() => {
    setPhase('input');
    setStandUrl('');
    setAuthorized(false);
    setErro('');
    setItems([]);
    setTruncated(false);
    cancelRef.current = false;
  }, [user?.uid]);

  const summary = useMemo(
    () => ({
      newCount: items.filter((i) => !i.alreadyImported).length,
      existingCount: items.filter((i) => i.alreadyImported).length,
      created: items.filter((i) => i.result === 'created').length,
      duplicates: items.filter((i) => i.result === 'duplicate').length,
      failed: items.filter((i) => i.result === 'failed' || i.result === 'blocked').length,
      skipped: items.filter((i) => i.result === 'skipped').length,
      rateLimited: items.some((i) => i.result === 'failed' && i.message === importErrorMessage('rate_limited')),
    }),
    [items],
  );

  if (!user) return null;

  const handleDiscover = async () => {
    setErro('');
    const parsed = validateStandvirtualInventoryUrl(standUrl);
    if (!parsed.valid || !parsed.normalizedUrl) {
      setErro(parsed.reason || 'URL inválido.');
      return;
    }
    setDiscovering(true);
    try {
      const [result, ownCars] = await Promise.all([
        discoverStandvirtualInventory(parsed.normalizedUrl),
        getCarrosByCreator(user.email),
      ]);
      if (!result.ok) {
        setErro(result.message);
        return;
      }
      if (result.urls.length === 0) {
        setErro('Nenhum anúncio publicado encontrado nesta página de stand.');
        return;
      }
      const importedIds = new Set(
        ownCars.filter((c) => c.origem === 'standvirtual' && c.origemId).map((c) => c.origemId!),
      );
      const seen = new Set<string>();
      setItems(
        result.urls.flatMap((url) => {
          const adId = extractStandvirtualAdId(url);
          if (!adId || seen.has(adId)) return [];
          seen.add(adId);
          return [{ url, adId, alreadyImported: importedIds.has(adId) }];
        }),
      );
      setTruncated(result.truncated);
      setPhase('review');
    } finally {
      setDiscovering(false);
    }
  };

  const handleImport = async () => {
    setPhase('running');
    cancelRef.current = false;
    const queue = items.filter((item) => !item.alreadyImported);

    const update = (adId: string, patch: Partial<ItemState>) =>
      setItems((prev) => prev.map((item) => (item.adId === adId ? { ...item, ...patch } : item)));

    let stopped = false;
    for (const [index, item] of queue.entries()) {
      if (cancelRef.current || stopped) {
        update(item.adId, { result: 'skipped' });
        continue;
      }
      update(item.adId, { result: 'importing' });

      let result = await importStandvirtualAdvert(item.url, { targetUid: user.uid });
      if (result.status === 'rate_limited') {
        await sleep(Math.min(result.retryAfterSeconds, 90) * 1000);
        if (!cancelRef.current) result = await importStandvirtualAdvert(item.url, { targetUid: user.uid });
      }

      if (result.status === 'created') {
        update(item.adId, { result: 'created', carId: result.carId });
      } else if (result.status === 'duplicate') {
        update(item.adId, { result: 'duplicate', carId: result.carId });
      } else if (result.status === 'blocked') {
        update(item.adId, { result: 'blocked' });
        stopped = true;
      } else if (result.status === 'rate_limited') {
        update(item.adId, { result: 'failed', message: importErrorMessage('rate_limited') });
      } else {
        update(item.adId, { result: 'failed', message: result.message });
        if (result.fatal) stopped = true;
      }

      if (index < queue.length - 1 && !cancelRef.current && !stopped) {
        await sleep(800 + Math.random() * 1200); // anti-bot pacing
      }
    }
    setPhase('done');
  };

  const resultChip = (item: ItemState) => {
    if (phase === 'review') {
      return item.alreadyImported ? <Badge cor="blue">Já importado</Badge> : <Badge cor="green">Novo</Badge>;
    }
    switch (item.result) {
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
            {item.carId && (
              <Link href={`/detalhes/${item.carId}`} target="_blank" className="text-xs font-semibold text-fg-link hover:underline">
                Ver
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
      default:
        return item.alreadyImported ? <Badge cor="blue">Já importado</Badge> : <Badge cor="gray">Na fila</Badge>;
    }
  };

  return (
    <Modal
      show
      onClose={phase === 'running' ? () => {} : onClose}
      titulo={`Importar inventário — ${user.nome || user.email}`}
      tamanho="lg"
    >
      <div className="space-y-4">
        {phase === 'input' && (
          <>
            <p className="text-sm text-fg">
              Importa os anúncios publicados do stand no Standvirtual <strong>para a conta deste
              utilizador</strong> ({user.email}), como rascunhos pendentes. Repetir a importação
              mais tarde funciona como sincronização: só os anúncios novos são criados.
            </p>
            <div>
              <label htmlFor="admin-stand-url" className="block text-xs font-bold text-fg mb-1.5">
                Página do stand
              </label>
              <input
                id="admin-stand-url"
                type="url"
                value={standUrl}
                onChange={(e) => {
                  setStandUrl(e.target.value);
                  setErro('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !discovering && standUrl.trim() && authorized) void handleDiscover();
                }}
                placeholder="https://omeustand.standvirtual.com/inventory"
                disabled={discovering}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                  erro ? 'border-danger-300' : 'border-slate-300 focus:border-accent'
                }`}
              />
              {erro && <p className="text-xs text-danger-600 mt-1">{erro}</p>}
            </div>
            <label className="flex items-start gap-2.5 bg-neutral-50 border border-neutral-200 rounded-xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={authorized}
                onChange={(e) => setAuthorized(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0"
              />
              <span className="text-sm text-fg">
                Confirmo que este cliente autorizou a importação dos seus anúncios e fotografias.
              </span>
            </label>
            <Button
              tipo="primario"
              blocoCompleto
              icone={<MagnifyingGlass weight="bold" />}
              carregando={discovering}
              disabled={discovering || !authorized || !standUrl.trim()}
              onClick={handleDiscover}
            >
              {discovering ? 'A procurar anúncios…' : 'Procurar anúncios'}
            </Button>
          </>
        )}

        {phase !== 'input' && (
          <>
            {phase === 'review' && (
              <Alert tipo="info" icone={<Storefront size={18} />}>
                {items.length} anúncio{items.length === 1 ? '' : 's'} encontrado
                {items.length === 1 ? '' : 's'} — {summary.newCount} novo{summary.newCount === 1 ? '' : 's'}
                {summary.existingCount > 0 && `, ${summary.existingCount} já importado${summary.existingCount === 1 ? '' : 's'}`}.
                {truncated && ' Lista parcial — repita mais tarde para os restantes.'}
              </Alert>
            )}

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1" aria-live="polite">
              {items.map((item) => (
                <div
                  key={item.adId}
                  className="flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg truncate" title={item.url}>
                      {item.url.replace('https://www.standvirtual.com/carros/anuncio/', '…/')}
                    </p>
                    {item.result === 'failed' && item.message && (
                      <p className="text-[11px] text-danger-600">{item.message}</p>
                    )}
                  </div>
                  <div className="shrink-0">{resultChip(item)}</div>
                </div>
              ))}
            </div>

            {phase === 'review' && (
              <div className="flex gap-3">
                <Button tipo="secundario" blocoCompleto onClick={() => setPhase('input')}>
                  Voltar
                </Button>
                <Button
                  tipo="primario"
                  blocoCompleto
                  disabled={summary.newCount === 0}
                  onClick={handleImport}
                >
                  {summary.newCount === 0
                    ? 'Nada novo a importar'
                    : `Importar ${summary.newCount} anúncio${summary.newCount === 1 ? '' : 's'}`}
                </Button>
              </div>
            )}

            {phase === 'running' && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-fg-muted inline-flex items-center gap-2">
                  <CircleNotch className="animate-spin text-accent" /> A importar um a um…
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
                <Alert
                  tipo={summary.created > 0 ? 'sucesso' : 'neutro'}
                  titulo="Resumo da importação"
                  icone={<CheckCircle size={18} />}
                >
                  {summary.created} criado{summary.created === 1 ? '' : 's'} · {summary.duplicates} já
                  existia{summary.duplicates === 1 ? '' : 'm'} · {summary.failed} falhou
                  {summary.failed === 1 ? '' : 'aram'}
                  {summary.skipped > 0 && ` · ${summary.skipped} não processado${summary.skipped === 1 ? '' : 's'}`}
                  {summary.rateLimited &&
                    ' — limite horário atingido; repita mais tarde para importar os restantes.'}
                </Alert>
                <Button tipo="primario" blocoCompleto onClick={onClose}>
                  Fechar
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
