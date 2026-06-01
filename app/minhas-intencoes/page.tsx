'use client';

import { ChatCircle, CircleNotch, Eye, MagnifyingGlass, Pause, Play, Plus, Trash, Tray, Users, WarningCircle } from '@phosphor-icons/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { formatarPreco } from '@/lib/utils';
import type { IntencaoCompra } from '@/types/intencao';
import Button from '@/components/ui/Button';

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
        <WarningCircle className="text-4xl text-slate-300 mb-4" />
        <p className="font-semibold text-fg-muted">Faça login para ver as suas intenções.</p>
        <Button tipo="primario" onClick={() => router.push('/perfil')} className="mt-3">Entrar</Button>
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
        <h1 className="text-xl font-extrabold text-fg-heading flex items-center gap-2">
          <MagnifyingGlass className="text-accent" /> Minhas Intenções
        </h1>
        <Button tipo="primario" tamanho="sm" icone={<Plus />} onClick={() => router.push('/comprar')}>
          Nova Intenção
        </Button>
      </div>

      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${tab === t.key ? 'bg-white text-accent shadow-sm' : 'text-fg-subtle hover:text-fg-heading'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CircleNotch className="animate-spin text-2xl text-accent" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Tray className="text-4xl mb-3 text-slate-300" />
          <p className="font-semibold text-fg-subtle">Nenhuma intenção {tab}</p>
          <p className="text-xs mt-1 text-fg-subtle">Crie uma intenção de compra para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((intencao) => (
            <div key={intencao.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:border-accent/30 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    intencao.categoria === 'carro' ? 'bg-blue-100 text-blue-700' :
                    intencao.categoria === 'moto' ? 'bg-orange-100 text-orange-700' :
                    intencao.categoria === 'viatura_comercial' ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {intencao.categoria === 'carro' ? '🚗 Carro' :
                     intencao.categoria === 'moto' ? '🏍️ Moto' :
                     intencao.categoria === 'viatura_comercial' ? '🚐 Comercial' :
                     '⚙️ Peças'}
                  </span>
                  <h3 className="font-bold text-fg-heading text-sm truncate">{intencao.titulo}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  intencao.status === 'ativa' ? 'bg-green-100 text-green-700' :
                  intencao.status === 'pausada' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-fg-subtle'
                }`}>
                  {intencao.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-fg-muted mb-3">
                {intencao.categoria !== 'pecas' ? (
                  <>
                    <span>Ano: {intencao.criterios.anoMinimo}{intencao.criterios.anoMaximo ? `–${intencao.criterios.anoMaximo}` : '+'}</span>
                    <span>Combustível: {intencao.criterios.combustivel.join(', ')}</span>
                  </>
                ) : (
                  <span className="col-span-2 italic text-fg-subtle">{intencao.descricao?.slice(0, 100)}</span>
                )}
                <span>Preço: {formatarPreco(intencao.criterios.precoMaximo)}</span>
                <span>Local: {intencao.criterios.localizacao.distrito} ({intencao.criterios.localizacao.raio}km)</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-fg-subtle mb-3">
                <span><Eye className="mr-1" />{intencao.stats.visualizacoes}</span>
                <span><ChatCircle className="mr-1" />{intencao.stats.contatos} contactos</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <Button
                  tipo="primario"
                  tamanho="sm"
                  icone={<Users />}
                  onClick={() => router.push(`/intencao/${intencao.id}/contatos`)}
                >
                  Ver contactos
                </Button>
                {intencao.status === 'ativa' ? (
                  <Button
                    tipo="secundario"
                    tamanho="sm"
                    icone={<Pause />}
                    onClick={() => handlePause(intencao.id)}
                  >
                    Pausar
                  </Button>
                ) : intencao.status === 'pausada' ? (
                  <Button tipo="verde" tamanho="sm" icone={<Play />} onClick={() => handleResume(intencao.id)}>
                    Reativar
                  </Button>
                ) : null}
                <Button tipo="perigo" tamanho="sm" icone={<Trash />} onClick={() => setConfirmDelete(intencao.id)}>
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h4 className="font-bold text-fg-heading mb-2">Remover Intenção</h4>
            <p className="text-sm text-fg-muted mb-4">Tem certeza? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2 justify-end">
              <Button tipo="terciario" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
              <Button tipo="perigo" onClick={handleDelete}>Remover</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
