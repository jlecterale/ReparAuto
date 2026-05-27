import { useState } from 'react';
import Badge from '@/components/ui/Badge';
import type { Verification, StatusVerificacao } from '@/types/verification';

interface VerificationsQueueProps {
  verifications: Verification[];
  loading: boolean;
  onUpdateStatus: (id: string, uid: string, status: StatusVerificacao, notasAdmin?: string) => Promise<void>;
}

function formatDate(timestamp: { toDate?: () => Date; seconds?: number }): string {
  const date = timestamp?.toDate?.() || (timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date());
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const statusColors: Record<StatusVerificacao, string> = {
  pendente: 'yellow',
  aprovado: 'green',
  rejeitado: 'red',
};

const statusLabels: Record<StatusVerificacao, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

export default function VerificationsQueue({ verifications, loading, onUpdateStatus }: VerificationsQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notas, setNotas] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <i className="fa-solid fa-spinner fa-spin text-2xl text-accent"></i>
      </div>
    );
  }

  const pendentes = verifications.filter((v) => v.status === 'pendente').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-brand-900 flex items-center gap-2">
          <i className="fa-solid fa-shield-halved text-blue-500"></i> Verificações
          {pendentes > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendentes}</span>
          )}
        </h3>
      </div>

      {verifications.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-xl">
          Nenhum pedido de verificação.
        </p>
      ) : (
        <div className="space-y-3">
          {verifications.map((v) => {
            const isExpanded = expandedId === v.id;

            return (
              <div key={v.id} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge cor={statusColors[v.status] as any}>{statusLabels[v.status]}</Badge>
                      <span className="text-xs font-semibold text-slate-600 capitalize">
                        <i className={`fa-solid ${v.tipo === 'profissional' ? 'fa-store' : 'fa-id-card'} mr-1`}></i>
                        {v.tipo}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(v.dataPedido)}</span>
                    </div>
                    <p className="text-sm font-semibold text-brand-900">{v.nome}</p>
                    <p className="text-xs text-slate-500">{v.email}</p>
                    {v.nif && <p className="text-xs text-slate-500">NIF: {v.nif}</p>}
                  </div>
                  {v.status === 'pendente' && (
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : v.id);
                        setNotas('');
                      }}
                      className="text-xs text-accent hover:text-accent-hover font-semibold ml-3"
                    >
                      <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    </button>
                  )}
                </div>

                {isExpanded && v.status === 'pendente' && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Notas de administração..."
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:ring-2 focus:ring-accent/30 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onUpdateStatus(v.id, v.uid, 'aprovado', notas)}
                        className="text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <i className="fa-solid fa-check mr-1"></i> Aprovar
                      </button>
                      <button
                        onClick={() => onUpdateStatus(v.id, v.uid, 'rejeitado', notas)}
                        className="text-xs font-bold bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        <i className="fa-solid fa-xmark mr-1"></i> Rejeitar
                      </button>
                    </div>
                  </div>
                )}

                {v.notasAdmin && (
                  <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <p className="text-[10px] text-yellow-700 font-bold uppercase">Notas Admin</p>
                    <p className="text-xs text-yellow-800">{v.notasAdmin}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
