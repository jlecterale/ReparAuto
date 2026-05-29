'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { formatarPreco } from '@/lib/utils';
import type { IntencaoCompra } from '@/types/intencao';

type TabStatus = 'ativas' | 'pausadas' | 'expiradas';

export default function MinhasIntencoes() {
  const { auth, intencoes } = useApp();
  const { isLoggedIn, user } = auth;
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<TabStatus>('ativas');
  const [lista, setLista] = useState<IntencaoCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await intencoes.getIntencoesPorUsuario(user.uid);
      setLista(data.filter((i) => i.status !== 'deletada'));
    } catch {
      toast?.erro('Erro ao carregar intenções.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, intencoes, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  if (!isLoggedIn) {
    return (
      <div className="text-center py-16">
        <i className="fa-solid fa-circle-exclamation text-4xl text-slate-300 mb-4"></i>
        <p className="font-semibold text-slate-600">Faça login para ver as suas intenções.</p>
        <button onClick={() => router.push('/perfil')} className="mt-3 bg-accent text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-accent-hover transition">Entrar</button>
      </div>
    );
  }

  const filtradas = lista.filter((i) => {
    if (tab === 'ativas') return i.status === 'ativa';
    if (tab === 'pausadas') return i.status === 'pausada';
    return i.status === 'expirada';
  });

  const handlePause = async (id: string) => {
    try {
      await intencoes.pausarIntencao(id, user!.uid);
      toast?.sucesso('Intenção pausada.');
      await carregar();
    } catch { toast?.erro('Erro ao pausar.'); }
  };

  const handleResume = async (id: string) => {
    try {
      await intencoes.reativarIntencao(id, user!.uid);
      toast?.sucesso('Intenção reativada.');
      await carregar();
    } catch { toast?.erro('Erro ao reativar.'); }
  };

  const handleDelete = async () => {
    if (!confirmDelete || !user) return;
    try {
      await intencoes.deletarIntencao(confirmDelete, user.uid);
      toast?.sucesso('Intenção removida.');
      setConfirmDelete(null);
      await carregar();
    } catch { toast?.erro('Erro ao remover.'); }
  };

  const tabs: { key: TabStatus; label: string }[] = [
    { key: 'ativas', label: `Ativas (${lista.filter((i) => i.status === 'ativa').length})` },
    { key: 'pausadas', label: `Pausadas (${lista.filter((i) => i.status === 'pausada').length})` },
    { key: 'expiradas', label: `Expiradas (${lista.filter((i) => i.status === 'expirada').length})` },
  ];

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-brand-900 flex items-center gap-2">
          <i className="fa-solid fa-magnifying-glass text-accent"></i> Minhas Intenções
        </h1>
        <button onClick={() => router.push('/anunciar')} className="bg-accent text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-accent-hover transition">
          <i className="fa-solid fa-plus mr-1"></i> Nova Intenção
        </button>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${tab === t.key ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-brand-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="fa-solid fa-spinner fa-spin text-2xl text-accent"></i>
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-200">
          <i className="fa-solid fa-inbox text-4xl mb-3 text-slate-300"></i>
          <p className="font-semibold text-slate-500">Nenhuma intenção {tab}</p>
          <p className="text-xs mt-1">Crie uma intenção de compra para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((intencao) => (
            <div key={intencao.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:border-accent/30 transition">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-brand-900 text-sm">{intencao.titulo}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  intencao.status === 'ativa' ? 'bg-green-100 text-green-700' :
                  intencao.status === 'pausada' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {intencao.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                <span>Ano: {intencao.criterios.anoMinimo}{intencao.criterios.anoMaximo ? `–${intencao.criterios.anoMaximo}` : '+'}</span>
                <span>Preço: {formatarPreco(intencao.criterios.precoMaximo)}</span>
                <span>Combustível: {intencao.criterios.combustivel.join(', ')}</span>
                <span>Local: {intencao.criterios.localizacao.distrito} ({intencao.criterios.localizacao.raio}km)</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                <span><i className="fa-solid fa-eye mr-1"></i>{intencao.stats.visualizacoes}</span>
                <span><i className="fa-solid fa-comment mr-1"></i>{intencao.stats.contatos} contactos</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => router.push(`/intencao/${intencao.id}/contatos`)}
                  className="text-xs font-bold bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-hover transition">
                  <i className="fa-solid fa-users mr-1"></i> Ver contactos
                </button>
                {intencao.status === 'ativa' ? (
                  <button onClick={() => handlePause(intencao.id)}
                    className="text-xs font-bold border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                    <i className="fa-solid fa-pause mr-1"></i> Pausar
                  </button>
                ) : intencao.status === 'pausada' ? (
                  <button onClick={() => handleResume(intencao.id)}
                    className="text-xs font-bold border border-green-300 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition">
                    <i className="fa-solid fa-play mr-1"></i> Reativar
                  </button>
                ) : null}
                <button onClick={() => setConfirmDelete(intencao.id)}
                  className="text-xs font-bold border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                  <i className="fa-solid fa-trash-can mr-1"></i> Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h4 className="font-bold text-brand-900 mb-2">Remover Intenção</h4>
            <p className="text-sm text-slate-600 mb-4">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
