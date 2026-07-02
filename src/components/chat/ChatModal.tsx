'use client';

import { ChatCircleDots, CircleNotch, PaperPlaneTilt, X } from '@phosphor-icons/react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/providers/AppProvider';
import { formatMessageTime } from '@/lib/utils';

export default function ChatModal() {
  const { auth, chat } = useApp();
  const { user } = auth;
  const {
    chatAberto,
    fecharChat,
    chatListingTitle,
    chatVendedorNome,
    enviarMensagem,
    conversa,
    carregandoConversa,
  } = chat;

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversa]);

  if (!chatAberto || !user) return null;

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    await enviarMensagem(texto);
    setTexto('');
    setEnviando(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h3 className="font-extrabold text-fg-heading text-sm">Chat com {chatVendedorNome}</h3>
            <p className="text-xs text-fg-subtle">{chatListingTitle}</p>
          </div>
          <button
            onClick={fecharChat}
            className="text-slate-400 hover:text-fg-muted transition p-1"
            aria-label="Fechar chat"
          >
            <X className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[50vh]">
          {carregandoConversa ? (
            <div className="flex items-center justify-center py-8">
              <CircleNotch className="animate-spin text-accent text-xl" />
            </div>
          ) : conversa.length === 0 ? (
            <div className="text-center py-8 text-fg-subtle">
              <ChatCircleDots className="text-3xl mb-2" />
              <p className="text-sm font-semibold">Nenhuma mensagem ainda</p>
              <p className="text-xs mt-1">Envie a primeira mensagem para {chatVendedorNome}.</p>
            </div>
          ) : (
            conversa.map((msg) => {
              const minha = msg.fromUid === user.uid;
              const time = formatMessageTime(msg.dataCriacao);
              return (
                <div key={msg.id} className={`flex ${minha ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      minha
                        ? 'bg-accent text-white rounded-br-md'
                        : 'bg-slate-100 text-fg rounded-bl-md'
                    }`}
                  >
                    <p>{msg.mensagem}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        minha ? 'text-white/70' : 'text-fg-subtle'
                      }`}
                    >
                      {time && `${time} · `}
                      {msg.lida ? '✓✓ Lida' : '✓ Enviada'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex gap-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva a sua mensagem..."
              rows={2}
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
            />
            <button
              onClick={handleEnviar}
              disabled={!texto.trim() || enviando}
              className="bg-accent hover:bg-accent-hover disabled:bg-slate-300 text-white px-4 py-2 rounded-xl transition flex items-center justify-center"
              aria-label="Enviar mensagem"
            >
              {enviando ? <CircleNotch className="animate-spin" /> : <PaperPlaneTilt />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
