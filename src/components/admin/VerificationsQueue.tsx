'use client';

import { CaretDown, CaretUp, Check, CircleNotch, File, IdentificationCard, ShieldCheck, Storefront, Trash, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { formatarDataHora } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import type { Verification, StatusVerificacao } from '@/types/verification';

interface VerificationsQueueProps {
  verifications: Verification[];
  loading: boolean;
  onUpdateStatus: (id: string, uid: string, status: StatusVerificacao, notasAdmin?: string) => Promise<void>;
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

const tipoDocLabels: Record<string, string> = {
  cc: 'Cartão de Cidadão',
  passaporte: 'Passaporte',
  residencia: 'Título de Residência',
};

export default function VerificationsQueue({ verifications, loading, onUpdateStatus }: VerificationsQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notas, setNotas] = useState('');
  const [imageModal, setImageModal] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <CircleNotch className="animate-spin text-2xl text-accent" />
      </div>
    );
  }

  const pendentes = verifications.filter((v) => v.status === 'pendente').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-fg-heading flex items-center gap-2">
          <ShieldCheck className="text-blue-500" /> Verificações
          {pendentes > 0 && <Badge cor="blue" variante="solid">{pendentes}</Badge>}
        </h3>
      </div>

      {verifications.length === 0 ? (
        <p className="text-sm text-fg-subtle text-center py-6 bg-slate-50 rounded-xl">
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
                      <span className="text-xs font-semibold text-fg-muted capitalize">
                        {v.tipo === 'profissional' ? <Storefront className="mr-1" /> : <IdentificationCard className="mr-1" />}
                        {v.tipo}
                      </span>
                      <span className="text-[10px] text-fg-subtle">{formatarDataHora(v.dataPedido)}</span>
                    </div>
                    <p className="text-sm font-semibold text-fg-heading">{v.nome}</p>
                    <p className="text-xs text-fg-subtle">{v.email}</p>
                    {v.nif && <p className="text-xs text-fg-subtle">NIF: {v.nif}</p>}
                    {v.tipoDocumento && (
                      <p className="text-xs text-fg-subtle">
                        <File className="mr-1" />
                        {tipoDocLabels[v.tipoDocumento] || v.tipoDocumento}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setExpandedId(isExpanded ? null : v.id);
                      setNotas('');
                    }}
                    className="text-xs text-accent hover:text-accent-hover font-semibold ml-3"
                  >
                    {isExpanded ? <CaretUp /> : <CaretDown />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    {/* Document images */}
                    {v.documentoUrl && v.selfieUrl && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1">Documento</p>
                          <div
                            className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:opacity-80 transition"
                            onClick={() => setImageModal(v.documentoUrl)}
                          >
                            <img src={v.documentoUrl} alt="Documento" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-wider mb-1">Selfie c/ Documento</p>
                          <div
                            className="w-full h-32 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:opacity-80 transition"
                            onClick={() => setImageModal(v.selfieUrl)}
                          >
                            <img src={v.selfieUrl} alt="Selfie com documento" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    )}

                    {!v.documentoUrl && !v.selfieUrl && v.status !== 'pendente' && (
                      <p className="text-xs text-fg-subtle italic mb-3">
                        <Trash className="mr-1" /> Documentos apagados após decisão.
                      </p>
                    )}

                    {v.status === 'pendente' && (
                      <>
                        <textarea
                          value={notas}
                          onChange={(e) => setNotas(e.target.value)}
                          placeholder="Notas de administração..."
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs resize-none h-16 focus:outline-none focus:ring-2 focus:ring-accent/30 mb-2"
                        />
                        <div className="flex gap-2">
                          <Button
                            tipo="verde"
                            tamanho="sm"
                            icone={<Check />}
                            onClick={() => onUpdateStatus(v.id, v.uid, 'aprovado', notas)}
                          >
                            Aprovar
                          </Button>
                          <Button
                            tipo="perigo"
                            tamanho="sm"
                            icone={<X />}
                            onClick={() => onUpdateStatus(v.id, v.uid, 'rejeitado', notas)}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {v.notasAdmin && (
                  <Alert tipo="aviso" titulo="Notas Admin" className="mt-2 !p-2 !rounded-lg">
                    {v.notasAdmin}
                  </Alert>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Image modal */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-fg-muted hover:text-red-500 transition z-10"
            >
              <X />
            </button>
            <img src={imageModal} alt="Documento ampliado" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
