'use client';

import { useMemo, useState } from 'react';
import { BellRinging } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { addAlertSubscription, ALERT_INVALID_ERROR, ALERT_LIMIT_ERROR } from '@/lib/db';
import { MAX_ALERT_SUBSCRIPTIONS, sanitizeSearchFilters } from '@/lib/alerts';
import type { SearchFilters } from '@/types/busca';

interface SaveAlertButtonProps {
  uid: string | undefined;
  filters: SearchFilters;
  onRequireLogin?: () => void;
}

const FILTER_LABELS: Partial<Record<keyof SearchFilters, string>> = {
  texto: 'Pesquisa',
  marca: 'Marca',
  modelo: 'Modelo',
  combustivel: 'Combustível',
  cambio: 'Câmbio',
  cor: 'Cor',
  portas: 'Portas',
  concelho: 'Concelho',
  distrito: 'Distrito',
  precoMin: 'Preço mín.',
  precoMax: 'Preço máx.',
  anoMin: 'Ano mín.',
  anoMax: 'Ano máx.',
  kmMin: 'Km mín.',
  kmMax: 'Km máx.',
  estadoVeiculo: 'Estado',
  rodando: 'A rodar',
  inspecao: 'Inspeção',
  minFotos: 'Mín. fotos',
};

/**
 * "Guardar como alerta" — turns the current advanced-search filters into a
 * saved-filter alert (plan 3.1; embedded by the plan 3.2 filter panel).
 * Renders nothing when there is no meaningful filter to save.
 */
export default function SaveAlertButton({ uid, filters, onRequireLogin }: SaveAlertButtonProps) {
  const [show, setShow] = useState(false);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const cleanFilters = useMemo(() => sanitizeSearchFilters(filters), [filters]);
  const activeEntries = useMemo(
    () =>
      (Object.keys(cleanFilters) as (keyof SearchFilters)[]).map((key) => ({
        key,
        label: FILTER_LABELS[key] ?? key,
        value: String(cleanFilters[key]),
      })),
    [cleanFilters],
  );

  if (activeEntries.length === 0) return null;

  const handleOpen = () => {
    if (!uid) {
      onRequireLogin?.();
      return;
    }
    setShow(true);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!uid) return;
    setSaving(true);
    try {
      await addAlertSubscription(uid, { tipo: 'filtro_salvo', nome, ativo: true, filters: cleanFilters });
      toast?.sucesso('Filtro guardado como alerta!');
      setShow(false);
      setNome('');
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === ALERT_LIMIT_ERROR) {
        toast?.erro(`Atingiu o limite de ${MAX_ALERT_SUBSCRIPTIONS} alertas. Apague um para criar outro.`);
      } else if (code === ALERT_INVALID_ERROR) {
        toast?.erro('Defina pelo menos um filtro antes de guardar o alerta.');
      } else {
        toast?.erro('Não foi possível guardar o alerta. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button tipo="secundario" tamanho="sm" icone={<BellRinging />} onClick={handleOpen}>
        Guardar como alerta
      </Button>

      <Modal show={show} onClose={() => setShow(false)} titulo="Guardar filtros como alerta" tamanho="md">
        <div className="space-y-4">
          <Input
            label="Nome do alerta"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder='Ex.: "Golf até 15.000 €"'
            maxLength={60}
          />
          <div>
            <p className="text-xs font-bold text-fg mb-2">Filtros incluídos</p>
            <div className="flex flex-wrap gap-1.5">
              {activeEntries.map((entry) => (
                <span
                  key={entry.key}
                  className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-full px-2.5 py-1 text-xs font-semibold"
                >
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-fg-muted">
            Avisamos quando um novo anúncio aprovado corresponder a estes filtros.
          </p>
          <Button
            tipo="primario"
            blocoCompleto
            carregando={saving}
            icone={<BellRinging />}
            onClick={handleSave}
          >
            Criar alerta
          </Button>
        </div>
      </Modal>
    </>
  );
}
