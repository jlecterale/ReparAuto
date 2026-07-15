'use client';

import { useMemo, useState } from 'react';
import { BellRinging, CheckCircle } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import useAlertSubscriptions from '@/hooks/useAlertSubscriptions';
import { ALERT_INVALID_ERROR, ALERT_LIMIT_ERROR } from '@/lib/db';
import { sanitizeSearchFilters } from '@/lib/alerts';
import type { SearchFilters } from '@/types/busca';

interface SaveAlertButtonProps {
  uid: string | undefined;
  filters: SearchFilters;
  onRequireLogin?: () => void;
}

/**
 * "Criar Alerta" — saves the current advanced-search filters as an alert
 * immediately (no naming modal; a short label is derived from the filters).
 * Disables itself right after success so the same combination can't be
 * saved twice, and re-enables the moment the filters actually change.
 */
export default function SaveAlertButton({ uid, filters, onRequireLogin }: SaveAlertButtonProps) {
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const toast = useToast();
  const { criar, atLimit, limite } = useAlertSubscriptions(uid);

  const cleanFilters = useMemo(() => sanitizeSearchFilters(filters), [filters]);
  const hasFilters = Object.keys(cleanFilters).length > 0;
  const snapshot = useMemo(() => JSON.stringify(cleanFilters), [cleanFilters]);
  const justCreated = savedSnapshot === snapshot;
  const disabled = !hasFilters || justCreated || (!!uid && atLimit) || saving;

  const handleClick = async () => {
    if (!uid) {
      onRequireLogin?.();
      return;
    }
    if (disabled) return;

    setSaving(true);
    try {
      await criar({ tipo: 'filtro_salvo', nome: '', ativo: true, filters: cleanFilters });
      toast?.sucesso('Alerta criado!');
      setSavedSnapshot(snapshot);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === ALERT_LIMIT_ERROR) {
        toast?.erro(`Atingiu o limite de ${limite} alertas. Apague um para criar outro.`);
      } else if (code === ALERT_INVALID_ERROR) {
        toast?.erro('Defina pelo menos um filtro antes de criar o alerta.');
      } else {
        toast?.erro('Não foi possível criar o alerta. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        tipo="secundario"
        tamanho="sm"
        blocoCompleto
        disabled={!!uid && disabled}
        carregando={saving}
        icone={justCreated ? <CheckCircle weight="fill" className="text-success-600" /> : <BellRinging />}
        onClick={handleClick}
      >
        {justCreated ? 'Alerta criado' : 'Criar Alerta'}
      </Button>
      {uid && !hasFilters && (
        <p className="text-xs text-fg-muted text-center">Defina pelo menos um filtro para criar um alerta.</p>
      )}
      {uid && hasFilters && atLimit && !justCreated && (
        <p className="text-xs text-fg-muted text-center">Limite de {limite} alertas atingido.</p>
      )}
    </div>
  );
}
