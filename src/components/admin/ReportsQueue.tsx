'use client';

import { CaretDown, CaretUp, Check, CircleNotch, Flag, MagnifyingGlass, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { MOTIVOS_DENUNCIA } from '@/lib/constants';
import { formatarDataHora } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { Report, StatusReport } from '@/types/report';

interface ReportsQueueProps {
  reports: Report[];
  loading: boolean;
  onUpdateStatus: (id: string, status: StatusReport, notasAdmin?: string) => Promise<void>;
}

const statusColors: Record<StatusReport, string> = {
  pendente: 'yellow',
  em_analise: 'blue',
  resolvido: 'green',
  rejeitado: 'red',
};

const statusLabels: Record<StatusReport, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  resolvido: 'Resolvido',
  rejeitado: 'Rejeitado',
};

export default function ReportsQueue({ reports, loading, onUpdateStatus }: ReportsQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [filter, setFilter] = useState<StatusReport | 'todos'>('todos');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <CircleNotch className="animate-spin text-2xl text-accent" />
      </div>
    );
  }

  const filtered = filter === 'todos' ? reports : reports.filter((r) => r.status === filter);
  const pendentes = reports.filter((r) => r.status === 'pendente').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-fg-heading flex items-center gap-2">
          <Flag className="text-red-500" /> Denúncias
          {pendentes > 0 && <Badge cor="red" variante="solid">{pendentes}</Badge>}
        </h3>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto">
        {(['todos', 'pendente', 'em_analise', 'resolvido', 'rejeitado'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition ${
              filter === f ? 'bg-accent text-white' : 'bg-slate-100 text-fg-muted hover:bg-slate-200'
            }`}
          >
            {f === 'todos' ? 'Todos' : statusLabels[f]}
            {f === 'pendente' && pendentes > 0 && ` (${pendentes})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-fg-subtle text-center py-6 bg-slate-50 rounded-xl">
          Nenhuma denúncia {filter !== 'todos' ? `com estado "${statusLabels[filter as StatusReport]}"` : ''}.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const motivoLabel = MOTIVOS_DENUNCIA.find((m) => m.value === report.motivo)?.label || report.motivo;
            const isExpanded = expandedId === report.id;

            return (
              <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge cor={statusColors[report.status] as any}>{statusLabels[report.status]}</Badge>
                      <span className="text-xs font-semibold text-fg-muted">{motivoLabel}</span>
                      <span className="text-[10px] text-fg-subtle">{formatarDataHora(report.dataCriacao)}</span>
                    </div>
                    <p className="text-xs text-fg-subtle">
                      <strong>Tipo:</strong> {report.alvoTipo} • <strong>ID:</strong> {report.alvoId.slice(0, 12)}...
                    </p>
                    <p className="text-xs text-fg-subtle">
                      <strong>Denunciante:</strong> {report.denuncianteEmail}
                    </p>
                    {report.descricao && (
                      <p className="text-sm text-fg mt-2 bg-slate-50 rounded-lg p-2">{report.descricao}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setExpandedId(isExpanded ? null : report.id);
                      setNotas('');
                    }}
                    className="text-xs text-accent hover:text-accent-hover font-semibold ml-3"
                  >
                    {isExpanded ? <CaretUp /> : <CaretDown />}
                  </button>
                </div>

                {isExpanded && report.status !== 'resolvido' && report.status !== 'rejeitado' && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Notas de administração..."
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:ring-2 focus:ring-accent/30 mb-2"
                    />
                    <div className="flex gap-2">
                      {report.status === 'pendente' && (
                        <Button
                          tipo="azul"
                          tamanho="sm"
                          icone={<MagnifyingGlass />}
                          onClick={() => onUpdateStatus(report.id, 'em_analise', notas)}
                        >
                          Em Análise
                        </Button>
                      )}
                      <Button
                        tipo="verde"
                        tamanho="sm"
                        icone={<Check />}
                        onClick={() => onUpdateStatus(report.id, 'resolvido', notas)}
                      >
                        Resolver
                      </Button>
                      <Button
                        tipo="perigo"
                        tamanho="sm"
                        icone={<X />}
                        onClick={() => onUpdateStatus(report.id, 'rejeitado', notas)}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                )}

                {report.notasAdmin && (
                  <Alert tipo="aviso" titulo="Notas Admin" className="mt-2 !p-2 !rounded-lg">
                    {report.notasAdmin}
                  </Alert>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
