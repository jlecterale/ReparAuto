'use client';

import { useState } from 'react';
import {
  BellRinging,
  BellSlash,
  CircleNotch,
  FunnelSimple,
  MagnifyingGlass,
  BookmarkSimple,
  Plus,
  Trash,
} from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';
import useAlertSubscriptions from '@/hooks/useAlertSubscriptions';
import KeywordAlertInput from './KeywordAlertInput';
import CriteriaAlertBuilder from './CriteriaAlertBuilder';
import type { AlertSubscription } from '@/types/alertas';

interface AlertSubscriptionsListProps {
  uid: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  carros: 'Carros',
  pecas: 'Peças',
  oficinas: 'Oficinas',
};

/** One-line human summary of what a subscription watches. */
function describeSubscription(sub: AlertSubscription): string {
  if (sub.tipo === 'palavra_chave') {
    const scope = sub.categoria ? ` em ${CATEGORIA_LABELS[sub.categoria]}` : '';
    return `Palavra-chave "${sub.keyword}"${scope}`;
  }
  if (sub.tipo === 'criterio') {
    const parts = [
      CATEGORIA_LABELS[sub.criteria.categoria],
      sub.criteria.tipoAnuncio,
      sub.criteria.marca,
      sub.criteria.concelho || sub.criteria.distrito,
    ].filter(Boolean);
    return `Novos anúncios: ${parts.join(' · ')}`;
  }
  const total = Object.keys(sub.filters).length;
  return `Filtro guardado (${total} ${total === 1 ? 'critério' : 'critérios'})`;
}

function subscriptionIcon(sub: AlertSubscription) {
  if (sub.tipo === 'palavra_chave') return <MagnifyingGlass size={18} className="text-accent" />;
  if (sub.tipo === 'criterio') return <FunnelSimple size={18} className="text-accent" />;
  return <BookmarkSimple size={18} className="text-accent" />;
}

/**
 * "Meus Alertas" — manage alert subscriptions from the profile: create,
 * pause/resume, delete, and see how many new matches arrived since the
 * last visit (novosResultados, bumped by the Cloud Function).
 */
export default function AlertSubscriptionsList({ uid }: AlertSubscriptionsListProps) {
  const { alertas, loading, atualizar, remover, atLimit, limite } = useAlertSubscriptions(uid);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'palavra_chave' | 'criterio'>('palavra_chave');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const toast = useToast();

  const handleToggle = async (sub: AlertSubscription) => {
    try {
      await atualizar(sub.id, { ativo: !sub.ativo });
    } catch {
      toast?.erro('Não foi possível atualizar o alerta.');
    }
  };

  const handleRemove = async (sub: AlertSubscription) => {
    setRemovingId(sub.id);
    try {
      await remover(sub.id);
      toast?.info('Alerta removido.');
    } catch {
      toast?.erro('Não foi possível remover o alerta.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleSeen = (sub: AlertSubscription) => {
    if (sub.novosResultados > 0) {
      atualizar(sub.id, { novosResultados: 0 }).catch(() => {});
    }
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <CircleNotch className="animate-spin text-accent text-2xl" />
        </div>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-8 text-fg-muted">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
            <BellRinging className="text-2xl text-fg-subtle" />
          </div>
          <p className="text-sm font-bold text-fg-heading">Ainda não tem alertas</p>
          <p className="text-xs text-fg-muted mt-1 max-w-[300px]">
            Crie um alerta e avisamos quando surgirem anúncios do seu interesse.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {alertas.map((sub) => (
            <li
              key={sub.id}
              onMouseEnter={() => handleSeen(sub)}
              onClick={() => handleSeen(sub)}
              className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                sub.ativo ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-200 opacity-70'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                {subscriptionIcon(sub)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-fg-heading truncate">{sub.nome}</p>
                  {sub.novosResultados > 0 && (
                    <Badge cor="accent" variante="solid" tamanho="sm">
                      {sub.novosResultados} novo{sub.novosResultados > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-fg-muted truncate mt-0.5">{describeSubscription(sub)}</p>
              </div>
              <button
                onClick={() => handleToggle(sub)}
                className="p-2 rounded-lg text-fg-muted hover:text-accent hover:bg-accent/10 transition-colors"
                aria-label={sub.ativo ? 'Pausar alerta' : 'Reativar alerta'}
                title={sub.ativo ? 'Pausar alerta' : 'Reativar alerta'}
              >
                {sub.ativo ? <BellRinging size={18} /> : <BellSlash size={18} />}
              </button>
              <button
                onClick={() => handleRemove(sub)}
                disabled={removingId === sub.id}
                className="p-2 rounded-lg text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
                aria-label="Remover alerta"
                title="Remover alerta"
              >
                <Trash size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        tipo="secundario"
        tamanho="sm"
        icone={<Plus />}
        onClick={() => setShowCreate(true)}
        disabled={atLimit}
      >
        Novo alerta
      </Button>
      {atLimit && (
        <p className="text-xs text-fg-muted">
          Limite de {limite} alertas atingido — remova um para criar outro.
        </p>
      )}

      <Modal show={showCreate} onClose={() => setShowCreate(false)} titulo="Novo alerta" tamanho="md">
        <div className="space-y-4">
          <SegmentedControl
            ariaLabel="Tipo de alerta"
            value={createMode}
            onChange={(value) => setCreateMode(value as 'palavra_chave' | 'criterio')}
            options={[
              { value: 'palavra_chave', label: 'Palavra-chave', icone: <MagnifyingGlass /> },
              { value: 'criterio', label: 'Critérios', icone: <FunnelSimple /> },
            ]}
          />
          {createMode === 'palavra_chave' ? (
            <KeywordAlertInput uid={uid} onCreated={() => setShowCreate(false)} />
          ) : (
            <CriteriaAlertBuilder uid={uid} onCreated={() => setShowCreate(false)} />
          )}
        </div>
      </Modal>
    </div>
  );
}
