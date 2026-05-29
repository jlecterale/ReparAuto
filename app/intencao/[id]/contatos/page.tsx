'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { formatarPreco, formatarData } from '@/lib/utils';
import { marcarContatoRelevante, rejeitarContato } from '@/lib/db';
import type { ContatoIntencao, IntencaoCompra } from '@/types/intencao';

type TabFiltro = 'todos' | 'novos' | 'respondidos';

export default function ContatosIntencao() {
  const params = useParams();
  const router = useRouter();
  const { auth, intencoes, chat } = useApp();
  const { user } = auth;
  const toast = useToast();
  const id = params?.id as string;

  const [intencao, setIntencao] = useState<IntencaoCompra | null>(null);
  const [contatos, setContatos] = useState<ContatoIntencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<TabFiltro>('todos');

  const carregar = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [intencaoData, contatosData] = await Promise.all([
        intencoes.getIntencaoPorId(id),
        intencoes.getContatosPorIntencao(id),
      ]);
      setIntencao(intencaoData);
      setContatos(contatosData);
    } catch {
      toast?.erro('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [id, intencoes, toast]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleMarcarRelevante = async (contatoId: string) => {
    try {
      await marcarContatoRelevante(contatoId, user?.uid || '');
      toast?.sucesso('Contato marcado como relevante.');
      await carregar();
    } catch { toast?.erro('Erro ao marcar.'); }
  };

  const handleRejeitar = async (contatoId: string) => {
    try {
      await rejeitarContato(contatoId, user?.uid || '');
      toast?.sucesso('Contato rejeitado.');
      await carregar();
    } catch { toast?.erro('Erro ao rejeitar.'); }
  };

  const handleAbrirChat = (contato: ContatoIntencao) => {
    chat.abrirChat(
      contato.intencaoId,
      'intencao',
      intencao?.titulo || '',
      contato.vendedorId,
      contato.titulo,
    );
  };

  const tabs: { key: TabFiltro; label: string }[] = [
    { key: 'todos', label: `Todos (${contatos.length})` },
    { key: 'novos', label: `Novos (${contatos.filter((c) => c.status === 'aberto').length})` },
    { key: 'respondidos', label: `Respondidos (${contatos.filter((c) => c.status !== 'aberto').length})` },
  ];

  const filtrados = contatos.filter((c) => {
    if (filtro === 'novos') return c.status === 'aberto';
    if (filtro === 'respondidos') return c.status !== 'aberto';
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><i className="fa-solid fa-spinner fa-spin text-2xl text-accent"></i></div>;
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <button onClick={() => router.back()} className="text-xs text-slate-500 hover:text-accent mb-4 flex items-center gap-1">
        <i className="fa-solid fa-arrow-left"></i> Voltar
      </button>

      <h1 className="text-xl font-extrabold text-brand-900 mb-1 flex items-center gap-2">
        <i className="fa-solid fa-comments text-accent"></i> Contactos
      </h1>
      {intencao && (
        <p className="text-sm text-slate-500 mb-6">{intencao.titulo}</p>
      )}

      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFiltro(t.key)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${filtro === t.key ? 'bg-white text-accent shadow-sm' : 'text-slate-500 hover:text-brand-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl shadow-sm border border-slate-200">
          <i className="fa-solid fa-inbox text-4xl mb-3 text-slate-300"></i>
          <p className="font-semibold text-slate-500">Nenhum contacto ainda</p>
          <p className="text-xs mt-1">Quando vendedores se interessarem, aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((contato) => (
            <div key={contato.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-user text-accent text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-brand-800">Vendedor</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      contato.status === 'aberto' ? 'bg-blue-100 text-blue-700' :
                      contato.status === 'respondido' ? 'bg-green-100 text-green-700' :
                      contato.status === 'rejeitado' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}>{contato.status}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">{contato.titulo}</p>
                  {contato.descricao && <p className="text-xs text-slate-500 mt-1">{contato.descricao}</p>}
                  {contato.precoOferido && <p className="text-xs text-accent font-bold mt-0.5">Oferta: {formatarPreco(contato.precoOferido)}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">{formatarData(contato.criadoEm)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => handleAbrirChat(contato)}
                  className="text-xs font-bold bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-hover transition">
                  <i className="fa-solid fa-comment mr-1"></i> Abrir Chat
                </button>
                {!contato.marcadoComoRelevante && (
                  <button onClick={() => handleMarcarRelevante(contato.id)}
                    className="text-xs font-bold border border-slate-300 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition">
                    <i className="fa-solid fa-star mr-1"></i> Relevante
                  </button>
                )}
                {contato.status !== 'rejeitado' && (
                  <button onClick={() => handleRejeitar(contato.id)}
                    className="text-xs font-bold border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                    <i className="fa-solid fa-xmark mr-1"></i> Rejeitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
