'use client';

import { CircleNotch, Tray, User, X } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useApp } from '@/providers/AppProvider';
import { formatMessageTime } from '@/lib/utils';
import type { Mensagem, ListingType } from '@/types/chat';

interface ChatInboxProps {
  show: boolean;
  onClose: () => void;
}

export default function ChatInbox({ show, onClose }: ChatInboxProps) {
  const { auth, chat } = useApp();
  const { user } = auth;
  const { abrirChat } = chat;
  const [conversas, setConversas] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || !user) {
      setConversas([]);
      return;
    }
    const uid = user.uid;
    setLoading(true);
    const q = query(
      collection(db, 'messages'),
      where('toUid', '==', uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const todas = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as Mensagem)
          .sort((a, b) => b.dataCriacao.toMillis() - a.dataCriacao.toMillis())
          .slice(0, 50);
        const latest = new Map<string, Mensagem>();
        for (const msg of todas) {
          const key = `${msg.listingId}_${msg.fromUid}`;
          if (!latest.has(key)) {
            latest.set(key, msg);
          }
        }
        setConversas(Array.from(latest.values()));
        setLoading(false);
      },
      (err) => {
        console.error('[ChatInbox] Erro ao carregar mensagens:', err);
        setConversas([]);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [show, user]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-extrabold text-fg-heading text-sm">Mensagens Recebidas</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-fg-muted transition p-1"
            aria-label="Fechar"
          >
            <X className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <CircleNotch className="animate-spin text-accent text-xl" />
            </div>
          ) : conversas.length === 0 ? (
            <div className="text-center py-8 text-fg-subtle">
              <Tray className="text-3xl mb-2" />
              <p className="text-sm font-semibold">Nenhuma mensagem recebida</p>
              <p className="text-xs mt-1">Quando alguém lhe enviar uma mensagem, aparecerá aqui.</p>
            </div>
          ) : (
            conversas.map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-accent transition cursor-pointer"
                onClick={() => {
                  abrirChat(
                    msg.listingId,
                    msg.listingType as ListingType,
                    msg.listingTitle,
                    msg.fromUid,
                    msg.fromNome,
                  );
                  onClose();
                }}
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <User className="text-accent text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-fg-heading truncate">{msg.fromNome}</span>
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-fg-muted">
                        {formatMessageTime(msg.dataCriacao)}
                      </span>
                      {!msg.lida && (
                        <span className="w-2 h-2 rounded-full bg-accent"></span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-fg-subtle truncate">{msg.listingTitle}</p>
                  <p className="text-xs text-fg-muted mt-0.5 truncate">{msg.mensagem}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
