import { useState, useEffect } from 'react';
import type { Carro, StatusAnuncio } from '@/types/carro';
import type { Peca } from '@/types/peca';
import { formatarPreco, formatarData } from '@/lib/utils';
import EditarCarroModal from './EditarCarroModal';
import EditarPecaModal from './EditarPecaModal';

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
}

type TabAnuncios = 'carros' | 'pecas';

export default function ListingsTable({ carros, pecas, defaultTab = 'carros', statusFilter, onDeleteCarro, onDeletePeca, onApproveCarro, onRejectCarro, onApprovePeca, onRejectPeca, onUpdateCarro, onUpdatePeca }: ListingsTableProps) {
  const [tab, setTab] = useState<TabAnuncios>(defaultTab);

  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  const carrosFiltrados = statusFilter ? carros.filter((c) => c.status === statusFilter) : carros;
  const pecasFiltrados = statusFilter ? pecas.filter((p) => p.status === statusFilter) : pecas;
  const [confirmDelete, setConfirmDelete] = useState<{ tipo: 'carro' | 'peca'; id: string; titulo: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editCarro, setEditCarro] = useState<Carro | null>(null);
  const [editPeca, setEditPeca] = useState<Peca | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

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
            tab === 'carros' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Carros ({carrosFiltrados.length})
        </button>
        <button
          onClick={() => setTab('pecas')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            tab === 'pecas' ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Peças ({pecasFiltrados.length})
        </button>
        {statusFilter && (
          <span className="ml-auto text-xs font-semibold text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <i className="fa-solid fa-filter"></i> Filtrando: {statusFilter === 'pendente' ? 'Pendentes' : statusFilter === 'aprovado' ? 'Aprovados' : 'Rejeitados'}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
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
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400 max-w-[80px] truncate">{c.id}</td>
                    <td className="py-3 pr-4 font-medium text-brand-900">
                      {c.marca} {c.modelo}
                    </td>
                    <td className="py-3 pr-4 font-bold text-accent">{formatarPreco(c.preco)}</td>
                    <td className="py-3 pr-4 text-slate-600 text-xs">{c.criador}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{formatarData(c.dataCriacao)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                        c.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {c.status === 'aprovado' ? 'Aprovado' : c.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => setEditCarro(c)}
                          disabled={!!actionLoading[c.id]}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition px-2 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-40"
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1"></i>Editar
                        </button>
                        {c.status !== 'aprovado' && (
                          <button
                            onClick={async () => {
                              setActionLoading((p) => ({ ...p, [c.id]: true }));
                              await onApproveCarro(c.id);
                              setActionLoading((p) => ({ ...p, [c.id]: false }));
                            }}
                            disabled={!!actionLoading[c.id]}
                            className="text-xs font-bold text-green-600 hover:text-green-800 transition px-2 py-1 rounded-lg hover:bg-green-50 disabled:opacity-40"
                            title="Aprovar"
                          >
                            {actionLoading[c.id] ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-check mr-1"></i>}Aprovar
                          </button>
                        )}
                        {c.status !== 'rejeitado' && (
                          <button
                            onClick={async () => {
                              setActionLoading((p) => ({ ...p, [c.id]: true }));
                              await onRejectCarro(c.id);
                              setActionLoading((p) => ({ ...p, [c.id]: false }));
                            }}
                            disabled={!!actionLoading[c.id]}
                            className="text-xs font-bold text-red-500 hover:text-red-700 transition px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
                            title="Rejeitar"
                          >
                            {actionLoading[c.id] ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-xmark mr-1"></i>}Rejeitar
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete({ tipo: 'carro', id: c.id, titulo: `${c.marca} ${c.modelo}` })}
                          disabled={!!actionLoading[c.id]}
                          className="text-xs font-bold text-red-500 hover:text-red-700 transition px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
                          title="Eliminar"
                        >
                          <i className="fa-solid fa-trash-can mr-1"></i>Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : pecasFiltrados.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400 max-w-[80px] truncate">{p.id}</td>
                    <td className="py-3 pr-4 font-medium text-brand-900">{p.titulo}</td>
                    <td className="py-3 pr-4 font-bold text-accent">
                      {p.preco != null && p.preco > 0 ? formatarPreco(p.preco) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 text-xs">{p.criador}</td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{formatarData(p.dataCriacao)}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                        p.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {p.status === 'aprovado' ? 'Aprovado' : p.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          onClick={() => setEditPeca(p)}
                          disabled={!!actionLoading[p.id]}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition px-2 py-1 rounded-lg hover:bg-blue-50 disabled:opacity-40"
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen-to-square mr-1"></i>Editar
                        </button>
                        {p.status !== 'aprovado' && (
                          <button
                            onClick={async () => {
                              setActionLoading((prev) => ({ ...prev, [p.id]: true }));
                              await onApprovePeca(p.id);
                              setActionLoading((prev) => ({ ...prev, [p.id]: false }));
                            }}
                            disabled={!!actionLoading[p.id]}
                            className="text-xs font-bold text-green-600 hover:text-green-800 transition px-2 py-1 rounded-lg hover:bg-green-50 disabled:opacity-40"
                            title="Aprovar"
                          >
                            {actionLoading[p.id] ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-check mr-1"></i>}Aprovar
                          </button>
                        )}
                        {p.status !== 'rejeitado' && (
                          <button
                            onClick={async () => {
                              setActionLoading((prev) => ({ ...prev, [p.id]: true }));
                              await onRejectPeca(p.id);
                              setActionLoading((prev) => ({ ...prev, [p.id]: false }));
                            }}
                            disabled={!!actionLoading[p.id]}
                            className="text-xs font-bold text-red-500 hover:text-red-700 transition px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
                            title="Rejeitar"
                          >
                            {actionLoading[p.id] ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-xmark mr-1"></i>}Rejeitar
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete({ tipo: 'peca', id: p.id, titulo: p.titulo })}
                          disabled={!!actionLoading[p.id]}
                          className="text-xs font-bold text-red-500 hover:text-red-700 transition px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
                          title="Eliminar"
                        >
                          <i className="fa-solid fa-trash-can mr-1"></i>Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            {(tab === 'carros' ? carrosFiltrados.length === 0 : pecasFiltrados.length === 0) && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
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
            <h3 className="text-lg font-extrabold text-brand-900 mb-2">Eliminar anúncio</h3>
            <p className="text-sm text-slate-600 mb-4">
              Tem a certeza que deseja eliminar o anúncio <strong>{confirmDelete.titulo}</strong>? Esta ação é irreversível.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting ? 'A eliminar...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
