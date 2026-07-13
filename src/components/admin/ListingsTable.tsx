'use client';

import { useState, useEffect } from 'react';
import { Funnel, PencilSimpleLine, Check, X, Trash, Lightning } from '@phosphor-icons/react';
import type { Carro, StatusAnuncio } from '@/types/carro';
import type { Peca } from '@/types/peca';
import { Timestamp } from 'firebase/firestore';
import { formatarPreco, formatarData } from '@/lib/utils';
import { docCountry } from '@/lib/country';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { BadgeCor } from '@/types/ui';
import EditarCarroModal from './EditarCarroModal';
import EditarPecaModal from './EditarPecaModal';

const STATUS_BADGE: Record<StatusAnuncio, { cor: BadgeCor; label: string }> = {
  aprovado: { cor: 'green', label: 'Aprovado' },
  pendente: { cor: 'yellow', label: 'Pendente' },
  rejeitado: { cor: 'red', label: 'Rejeitado' },
};

interface ListingsTableProps {
  carros: Carro[];
  pecas: Peca[];
  defaultTab?: 'carros' | 'pecas';
  statusFilter?: StatusAnuncio | null;
  onDeleteCarro: (id: string) => Promise<void>;
  onDeletePeca: (id: string) => Promise<void>;
  onApproveCarro: (id: string) => Promise<void>;
  onRejectCarro: (id: string) => Promise<void>;
  onApprovePeca: (id: string) => Promise<void>;
  onRejectPeca: (id: string) => Promise<void>;
  onUpdateCarro: (id: string, dados: Record<string, unknown>) => Promise<void>;
  onUpdatePeca: (id: string, dados: Record<string, unknown>) => Promise<void>;
  onBulkAction: (tipo: 'carro' | 'peca', action: 'aprovar' | 'rejeitar' | 'eliminar', ids: string[]) => Promise<void>;
}

type TabAnuncios = 'carros' | 'pecas';

export default function ListingsTable({ carros, pecas, defaultTab = 'carros', statusFilter, onDeleteCarro, onDeletePeca, onApproveCarro, onRejectCarro, onApprovePeca, onRejectPeca, onUpdateCarro, onUpdatePeca, onBulkAction }: ListingsTableProps) {
  const [tab, setTab] = useState<TabAnuncios>(defaultTab);

  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  const carrosFiltrados = statusFilter ? carros.filter((c) => c.status === statusFilter) : carros;
  const pecasFiltrados = statusFilter ? pecas.filter((p) => p.status === statusFilter) : pecas;
  const [confirmDelete, setConfirmDelete] = useState<{ tipo: 'carro' | 'peca'; id: string; titulo: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editCarro, setEditCarro] = useState<Carro | null>(null);
  const [editPeca, setEditPeca] = useState<Peca | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Bulk selection (scoped to the visible tab + filter)
  const idsVisiveis = (tab === 'carros' ? carrosFiltrados : pecasFiltrados).map((x) => x.id);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  useEffect(() => { setSelected(new Set()); }, [tab, statusFilter]);
  const allSelected = idsVisiveis.length > 0 && idsVisiveis.every((id) => selected.has(id));
  const someSelected = idsVisiveis.some((id) => selected.has(id));
  const toggleOne = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(idsVisiveis));
  const runBulk = async (action: 'aprovar' | 'rejeitar' | 'eliminar') => {
    const ids = idsVisiveis.filter((id) => selected.has(id));
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await onBulkAction(tab === 'carros' ? 'carro' : 'peca', action, ids);
      setSelected(new Set());
      setConfirmBulkDelete(false);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.tipo === 'carro') {
        await onDeleteCarro(confirmDelete.id);
      } else {
        await onDeletePeca(confirmDelete.id);
      }
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setTab('carros')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            tab === 'carros' ? 'bg-accent text-white' : 'bg-slate-100 text-fg-muted hover:bg-slate-200'
          }`}
        >
          Carros ({carrosFiltrados.length})
        </button>
        <button
          onClick={() => setTab('pecas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            tab === 'pecas' ? 'bg-accent text-white' : 'bg-slate-100 text-fg-muted hover:bg-slate-200'
          }`}
        >
          Peças ({pecasFiltrados.length})
        </button>
        {statusFilter && (
          <Badge cor="yellow" tamanho="md" className="ml-auto">
            <Funnel /> Filtrando: {statusFilter === 'pendente' ? 'Pendentes' : statusFilter === 'aprovado' ? 'Aprovados' : 'Rejeitados'}
          </Badge>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-4 p-2.5 rounded-xl bg-accent/10 border border-accent/30">
          <span className="text-xs font-bold text-fg-strong px-1">
            {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold text-fg-muted hover:text-fg underline underline-offset-2"
          >
            Limpar
          </button>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Button tipo="verde" tamanho="sm" icone={<Check />} onClick={() => runBulk('aprovar')} disabled={bulkLoading} carregando={bulkLoading}>
              Aprovar
            </Button>
            <Button tipo="aviso" tamanho="sm" icone={<X />} onClick={() => runBulk('rejeitar')} disabled={bulkLoading} carregando={bulkLoading}>
              Rejeitar
            </Button>
            <Button tipo="perigo" tamanho="sm" icone={<Trash />} onClick={() => setConfirmBulkDelete(true)} disabled={bulkLoading}>
              Eliminar
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-fg-subtle uppercase tracking-wider border-b border-slate-200">
              <th className="pb-3 pr-3 w-0">
                <input
                  type="checkbox"
                  aria-label="Selecionar todos"
                  className="w-4 h-4 cursor-pointer accent-accent align-middle"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                  onChange={toggleAll}
                />
              </th>
              <th className="pb-3 pr-4">ID</th>
              <th className="pb-3 pr-4">Título</th>
              <th className="pb-3 pr-4">Preço</th>
              <th className="pb-3 pr-4">Criador</th>
              <th className="pb-3 pr-4">Data</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Ações</th>
            </tr>
          </thead>
          <tbody>
              {tab === 'carros'
              ? carrosFiltrados.map((c) => (
                  <tr key={c.id} className={`border-b border-slate-100 transition ${selected.has(c.id) ? 'bg-accent/5' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${c.marca} ${c.modelo}`}
                        className="w-4 h-4 cursor-pointer accent-accent align-middle"
                        checked={selected.has(c.id)}
                        onChange={() => toggleOne(c.id)}
                      />
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-fg-subtle max-w-[80px] truncate">{c.id}</td>
                    <td className="py-3 pr-4 font-medium text-fg-heading">
                      <div className="flex items-center gap-1.5">
                        {c.marca} {c.modelo}
                        {c.impulso?.ativo && (
                          <span title="Premium / Turbo">
                            <Lightning weight="fill" className="text-amber-700 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-bold text-accent">{formatarPreco(c.preco, docCountry(c))}</td>
                    <td className="py-3 pr-4 text-fg-muted text-xs">{c.criador}</td>
                    <td className="py-3 pr-4 text-fg-subtle text-xs">{formatarData(c.dataCriacao)}</td>
                    <td className="py-3 pr-4">
                      <Badge cor={STATUS_BADGE[c.status].cor}>{STATUS_BADGE[c.status].label}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          tipo="terciario"
                          tamanho="sm"
                          onClick={() => setEditCarro(c)}
                          disabled={!!actionLoading[c.id]}
                          icone={<PencilSimpleLine />}
                          title="Editar"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          Editar
                        </Button>
                        <Button
                          tipo={c.impulso?.ativo ? 'premium' : 'terciario'}
                          tamanho="sm"
                          onClick={async () => {
                            setActionLoading((prev) => ({ ...prev, [c.id]: true }));
                            const novoEstado = !c.impulso?.ativo;
                            await onUpdateCarro(c.id, {
                              impulso: {
                                ativo: novoEstado,
                                dataInicio: novoEstado ? Timestamp.now() : null,
                                dataFim: novoEstado ? Timestamp.fromDate(new Date(Date.now() + 30 * 86400000)) : null,
                              }
                            });
                            setActionLoading((prev) => ({ ...prev, [c.id]: false }));
                          }}
                          disabled={!!actionLoading[c.id]}
                          icone={<Lightning weight={c.impulso?.ativo ? 'fill' : 'regular'} />}
                          title={c.impulso?.ativo ? 'Remover Destaque Turbo' : 'Destacar Turbo'}
                        >
                          {c.impulso?.ativo ? 'Turbo' : 'Destacar'}
                        </Button>
                        {c.status !== 'aprovado' && (
                          <Button
                            tipo="verde"
                            tamanho="sm"
                            onClick={async () => {
                              setActionLoading((p) => ({ ...p, [c.id]: true }));
                              await onApproveCarro(c.id);
                              setActionLoading((p) => ({ ...p, [c.id]: false }));
                            }}
                            disabled={!!actionLoading[c.id]}
                            carregando={!!actionLoading[c.id]}
                            icone={<Check />}
                            title="Aprovar"
                          >
                            Aprovar
                          </Button>
                        )}
                        {c.status !== 'rejeitado' && (
                          <Button
                            tipo="perigo"
                            tamanho="sm"
                            onClick={async () => {
                              setActionLoading((p) => ({ ...p, [c.id]: true }));
                              await onRejectCarro(c.id);
                              setActionLoading((p) => ({ ...p, [c.id]: false }));
                            }}
                            disabled={!!actionLoading[c.id]}
                            carregando={!!actionLoading[c.id]}
                            icone={<X />}
                            title="Rejeitar"
                          >
                            Rejeitar
                          </Button>
                        )}
                        <Button
                          tipo="perigo"
                          tamanho="sm"
                          onClick={() => setConfirmDelete({ tipo: 'carro', id: c.id, titulo: `${c.marca} ${c.modelo}` })}
                          disabled={!!actionLoading[c.id]}
                          icone={<Trash />}
                          title="Eliminar"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              : pecasFiltrados.map((p) => (
                  <tr key={p.id} className={`border-b border-slate-100 transition ${selected.has(p.id) ? 'bg-accent/5' : 'hover:bg-slate-50'}`}>
                    <td className="py-3 pr-3">
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${p.titulo}`}
                        className="w-4 h-4 cursor-pointer accent-accent align-middle"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                      />
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-fg-subtle max-w-[80px] truncate">{p.id}</td>
                    <td className="py-3 pr-4 font-medium text-fg-heading">
                      <div className="flex items-center gap-1.5">
                        {p.titulo}
                        {p.impulso?.ativo && (
                          <span title="Premium / Turbo">
                            <Lightning weight="fill" className="text-amber-700 shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-bold text-accent">
                      {p.preco != null && p.preco > 0 ? formatarPreco(p.preco, docCountry(p)) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-fg-muted text-xs">{p.criador}</td>
                    <td className="py-3 pr-4 text-fg-subtle text-xs">{formatarData(p.dataCriacao)}</td>
                    <td className="py-3 pr-4">
                      <Badge cor={STATUS_BADGE[p.status].cor}>{STATUS_BADGE[p.status].label}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button
                          tipo="terciario"
                          tamanho="sm"
                          onClick={() => setEditPeca(p)}
                          disabled={!!actionLoading[p.id]}
                          icone={<PencilSimpleLine />}
                          title="Editar"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          Editar
                        </Button>
                        <Button
                          tipo={p.impulso?.ativo ? 'premium' : 'terciario'}
                          tamanho="sm"
                          onClick={async () => {
                            setActionLoading((prev) => ({ ...prev, [p.id]: true }));
                            const novoEstado = !p.impulso?.ativo;
                            await onUpdatePeca(p.id, {
                              impulso: {
                                ativo: novoEstado,
                                dataInicio: novoEstado ? Timestamp.now() : null,
                                dataFim: novoEstado ? Timestamp.fromDate(new Date(Date.now() + 30 * 86400000)) : null,
                              }
                            });
                            setActionLoading((prev) => ({ ...prev, [p.id]: false }));
                          }}
                          disabled={!!actionLoading[p.id]}
                          icone={<Lightning weight={p.impulso?.ativo ? 'fill' : 'regular'} />}
                          title={p.impulso?.ativo ? 'Remover Destaque Turbo' : 'Destacar Turbo'}
                        >
                          {p.impulso?.ativo ? 'Turbo' : 'Destacar'}
                        </Button>
                        {p.status !== 'aprovado' && (
                          <Button
                            tipo="verde"
                            tamanho="sm"
                            onClick={async () => {
                              setActionLoading((prev) => ({ ...prev, [p.id]: true }));
                              await onApprovePeca(p.id);
                              setActionLoading((prev) => ({ ...prev, [p.id]: false }));
                            }}
                            disabled={!!actionLoading[p.id]}
                            carregando={!!actionLoading[p.id]}
                            icone={<Check />}
                            title="Aprovar"
                          >
                            Aprovar
                          </Button>
                        )}
                        {p.status !== 'rejeitado' && (
                          <Button
                            tipo="perigo"
                            tamanho="sm"
                            onClick={async () => {
                              setActionLoading((prev) => ({ ...prev, [p.id]: true }));
                              await onRejectPeca(p.id);
                              setActionLoading((prev) => ({ ...prev, [p.id]: false }));
                            }}
                            disabled={!!actionLoading[p.id]}
                            carregando={!!actionLoading[p.id]}
                            icone={<X />}
                            title="Rejeitar"
                          >
                            Rejeitar
                          </Button>
                        )}
                        <Button
                          tipo="perigo"
                          tamanho="sm"
                          onClick={() => setConfirmDelete({ tipo: 'peca', id: p.id, titulo: p.titulo })}
                          disabled={!!actionLoading[p.id]}
                          icone={<Trash />}
                          title="Eliminar"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            {(tab === 'carros' ? carrosFiltrados.length === 0 : pecasFiltrados.length === 0) && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-fg-subtle text-sm">
                  Nenhum anúncio encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editCarro && (
        <EditarCarroModal
          show={true}
          onClose={() => setEditCarro(null)}
          carro={editCarro}
          onSave={onUpdateCarro}
        />
      )}

      {editPeca && (
        <EditarPecaModal
          show={true}
          onClose={() => setEditPeca(null)}
          peca={editPeca}
          onSave={onUpdatePeca}
        />
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-fg-heading mb-2">Eliminar anúncio</h3>
            <p className="text-sm text-fg-muted mb-4">
              Tem a certeza que deseja eliminar o anúncio <strong>{confirmDelete.titulo}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                tipo="secundario"
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </Button>
              <Button
                tipo="perigo"
                onClick={handleDelete}
                disabled={deleting}
                carregando={deleting}
              >
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmBulkDelete && (
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4"
          onClick={() => !bulkLoading && setConfirmBulkDelete(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-extrabold text-fg-heading mb-2">
              Eliminar {selected.size} anúncio{selected.size !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-fg-muted mb-4">
              Vai eliminar {selected.size} anúncio{selected.size !== 1 ? 's' : ''} de forma permanente. Esta ação é irreversível.
            </p>
            <div className="flex gap-3 justify-end">
              <Button tipo="secundario" onClick={() => setConfirmBulkDelete(false)} disabled={bulkLoading}>
                Cancelar
              </Button>
              <Button tipo="perigo" onClick={() => runBulk('eliminar')} disabled={bulkLoading} carregando={bulkLoading}>
                {bulkLoading ? 'A eliminar...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
