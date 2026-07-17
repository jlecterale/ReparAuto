'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, Star, CircleNotch } from '@phosphor-icons/react';
import { getContatosByVendedor, marcarContatoRelevante } from '@/lib/db';
import { formatarData } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import type { ContatoIntencao } from '@/types/intencao';
import type { StatusContato } from '@/types/intencao';

interface Props {
  vendedorId: string;
}

const STATUS_LABEL: Record<StatusContato, string> = {
  aberto: 'Novo',
  respondido: 'Em conversa',
  aceito: 'Ganho',
  rejeitado: 'Perdido',
  finalizado: 'Concluído',
};

const STATUS_COR: Record<StatusContato, 'blue' | 'yellow' | 'green' | 'gray'> = {
  aberto: 'blue',
  respondido: 'yellow',
  aceito: 'green',
  rejeitado: 'gray',
  finalizado: 'green',
};

export default function LeadsInbox({ vendedorId }: Props) {
  const toast = useToast();
  const [contatos, setContatos] = useState<ContatoIntencao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getContatosByVendedor(vendedorId)
      .then((list) => !cancelled && setContatos(list))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [vendedorId]);

  const toggleRelevante = useCallback(
    async (id: string) => {
      try {
        await marcarContatoRelevante(id, vendedorId);
        setContatos((prev) => prev.map((c) => (c.id === id ? { ...c, marcadoComoRelevante: true } : c)));
        toast?.sucesso('Marcado como relevante.');
      } catch {
        toast?.erro('Não foi possível atualizar.');
      }
    },
    [vendedorId, toast],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-fg-muted">
        <CircleNotch className="animate-spin" size={28} />
      </div>
    );
  }

  if (contatos.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 flex flex-col items-center justify-center text-center py-16 text-fg-muted">
        <Target size={40} className="mb-3 text-neutral-300" />
        <p className="font-semibold text-fg">Ainda sem oportunidades.</p>
        <p className="text-sm">
          Os contactos que faz a intenções de compra aparecem aqui, com o estado de cada negociação.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 divide-y divide-neutral-100">
      {contatos.map((c) => (
        <div key={c.id} className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-fg truncate">{c.titulo}</p>
              <Badge cor={STATUS_COR[c.status]} variante="soft">
                {STATUS_LABEL[c.status]}
              </Badge>
              {c.marcadoComoRelevante && (
                <Badge cor="yellow" variante="soft">
                  <Star weight="fill" /> Relevante
                </Badge>
              )}
            </div>
            <p className="text-xs text-fg-muted mt-0.5">{formatarData(c.criadoEm)}</p>
          </div>
          {!c.marcadoComoRelevante && (
            <button
              onClick={() => toggleRelevante(c.id)}
              className="text-xs font-bold text-accent hover:text-accent-hover border border-accent/30 px-3 py-1.5 rounded-full transition hover:bg-accent/5 shrink-0"
            >
              <Star className="mr-1" /> Marcar relevante
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
