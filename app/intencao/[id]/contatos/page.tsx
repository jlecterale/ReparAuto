'use client';

import { ArrowLeft, ChatCircle, Chats, CircleNotch, Star, Tray, User, X } from '@phosphor-icons/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { formatarPreco, formatarData } from '@/lib/utils';
import { marcarContatoRelevante, rejeitarContato } from '@/lib/db';
import type { ContatoIntencao, IntencaoCompra } from '@/types/intencao';
import Button from '@/components/ui/Button';

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
    return <div className="flex items-center justify-center py-20"><CircleNotch className="animate-spin text-2xl text-accent" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto page-enter">
      <Button tipo="terciario" tamanho="sm" icone={<ArrowLeft />} onClick={() => router.back()} className="mb-4">
        Voltar
      </Button>

      <h1 className="text-xl font-extrabold text-fg-heading mb-1 flex items-center gap-2">
        <Chats className="text-accent" /> Contactos
      </h1>
      {intencao && (
        <p className="text-sm text-fg-subtle mb-6">{intencao.titulo}</p>
      )}

      <div className="flex gap-1 mb-4 bg-slate-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setFiltro(t.key)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${filtro === t.key ? 'bg-white text-accent shadow-sm' : 'text-fg-subtle hover:text-fg-heading'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
          <Tray className="text-4xl mb-3 text-slate-300" />
          <p className="font-semibold text-fg-subtle">Nenhum contacto ainda</p>
          <p className="text-xs mt-1 text-fg-subtle">Quando vendedores se interessarem, aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((contato) => (
            <div key={contato.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <User className="text-accent text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-fg-heading">Vendedor</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      contato.status === 'aberto' ? 'bg-blue-100 text-blue-700' :
                      contato.status === 'respondido' ? 'bg-green-100 text-green-700' :
                      contato.status === 'rejeitado' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-fg-subtle'
                    }`}>{contato.status}</span>
                  </div>
                  <p className="text-xs font-semibold text-fg mt-0.5">{contato.titulo}</p>
                  {contato.descricao && <p className="text-xs text-fg-subtle mt-1">{contato.descricao}</p>}
                  {contato.precoOferido && <p className="text-xs text-accent font-bold mt-0.5">Oferta: {formatarPreco(contato.precoOferido)}</p>}
                  <p className="text-[10px] text-fg-subtle mt-1">{formatarData(contato.criadoEm)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <Button
                  tipo="primario"
                  tamanho="sm"
                  icone={<ChatCircle />}
                  onClick={() => handleAbrirChat(contato)}
                >
                  Abrir Chat
                </Button>
                {!contato.marcadoComoRelevante && (
                  <Button
                    tipo="secundario"
                    tamanho="sm"
                    icone={<Star />}
                    onClick={() => handleMarcarRelevante(contato.id)}
                  >
                    Relevante
                  </Button>
                )}
                {contato.status !== 'rejeitado' && (
                  <Button tipo="perigo" tamanho="sm" icone={<X />} onClick={() => handleRejeitar(contato.id)}>
                    Rejeitar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
