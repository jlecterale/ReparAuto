'use client';

import { Check, X, ChatCircle } from '@phosphor-icons/react';
import { formatarPreco } from '@/lib/utils';
import { formatarData } from '@/lib/utils';
import type { Proposta, StatusProposta } from '@/types/proposal';

interface PropostaCardProps {
  proposta: Proposta;
  role: 'vendedor' | 'comprador';
  onAceitar?: (id: string) => void;
  onRejeitar?: (id: string) => void;
  onAbrirChat?: (proposta: Proposta) => void;
}

const statusConfig: Record<StatusProposta, { label: string; bg: string; text: string }> = {
  pendente: { label: 'Pendente', bg: 'bg-amber-50', text: 'text-amber-700' },
  aceita: { label: 'Aceite', bg: 'bg-green-50', text: 'text-green-700' },
  rejeitada: { label: 'Rejeitada', bg: 'bg-red-50', text: 'text-red-700' },
  expirada: { label: 'Expirada', bg: 'bg-slate-50', text: 'text-slate-500' },
  cancelada: { label: 'Cancelada', bg: 'bg-slate-50', text: 'text-slate-500' },
};

export default function PropostaCard({ proposta, role, onAceitar, onRejeitar, onAbrirChat }: PropostaCardProps) {
  const cfg = statusConfig[proposta.status] || statusConfig.pendente;
  const isPending = proposta.status === 'pendente';

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isPending ? 'border-accent/30 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-sm' : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-fg-heading truncate">{proposta.anuncioTitulo}</p>
          <p className="text-xs text-fg-subtle mt-0.5">
            {role === 'comprador'
              ? `De: ${proposta.vendedorNome}`
              : `Para: ${proposta.compradorNome}`}
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>

      {/* Value comparison */}
      <div className="flex items-center gap-4 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-fg-subtle font-bold">Contra-proposta</p>
          <p className="text-lg font-extrabold text-accent">{formatarPreco(proposta.valor)}</p>
        </div>
        {proposta.anuncioPrecoOriginal > 0 && (
          <>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-fg-subtle font-bold">Preço original</p>
              <p className="text-sm font-bold text-fg-muted">{formatarPreco(proposta.anuncioPrecoOriginal)}</p>
            </div>
            <div className="ml-auto">
              {proposta.valor < proposta.anuncioPrecoOriginal ? (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  -{Math.round(((proposta.anuncioPrecoOriginal - proposta.valor) / proposta.anuncioPrecoOriginal) * 100)}%
                </span>
              ) : proposta.valor > proposta.anuncioPrecoOriginal ? (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  +{Math.round(((proposta.valor - proposta.anuncioPrecoOriginal) / proposta.anuncioPrecoOriginal) * 100)}%
                </span>
              ) : null}
            </div>
          </>
        )}
      </div>

      {/* Message */}
      {proposta.mensagem && (
        <div className="text-xs text-fg-muted bg-white/80 border border-slate-100 rounded-lg px-3 py-2 mb-3 italic">
          &ldquo;{proposta.mensagem}&rdquo;
        </div>
      )}

      {/* Date */}
      <p className="text-[10px] text-fg-subtle mb-3">{formatarData(proposta.criadaEm)}</p>

      {/* Actions (only for buyer receiving a proposal) */}
      {role === 'comprador' && isPending && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => onAceitar?.(proposta.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition"
          >
            <Check size={14} weight="bold" />
            Aceitar
          </button>
          <button
            onClick={() => onRejeitar?.(proposta.id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition"
          >
            <X size={14} weight="bold" />
            Rejeitar
          </button>
          <button
            onClick={() => onAbrirChat?.(proposta)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-accent bg-blue-50 rounded-xl hover:bg-blue-100 transition"
          >
            <ChatCircle size={14} weight="fill" />
            Chat
          </button>
        </div>
      )}

      {/* Chat button for vendor after response */}
      {role === 'vendedor' && proposta.status === 'aceita' && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => onAbrirChat?.(proposta)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-accent to-accent-hover rounded-xl hover:shadow-lg transition"
          >
            <ChatCircle size={14} weight="fill" />
            Abrir Conversa
          </button>
        </div>
      )}
    </div>
  );
}
