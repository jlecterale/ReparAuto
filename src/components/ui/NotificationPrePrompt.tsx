'use client';

import { Bell, ChatCircle, CheckCircle, Tag } from '@phosphor-icons/react';
import { useState, useCallback } from 'react';
import { requestNotificationPermission } from '@/lib/fcm';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';

interface Props {
  uid: string;
  onDismiss: () => void;
  onToken: (token: string) => void;
}

export default function NotificationPrePrompt({ uid, onDismiss, onToken }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAccept = useCallback(async () => {
    setLoading(true);
    const token = await requestNotificationPermission();
    if (token) {
      try {
        await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true });
      } catch {}
      onToken(token);
    }
    setLoading(false);
    onDismiss();
  }, [uid, onDismiss, onToken]);

  return (
    <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 page-enter">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bell className="text-2xl text-accent" />
          </div>
          <h3 className="font-extrabold text-fg-heading text-lg">Ativar Notificações?</h3>
          <p className="text-sm text-fg-subtle mt-2">
            Receba alertas quando receber mensagens sobre os seus anúncios ou quando anúncios do seu interesse forem publicados.
          </p>
        </div>

        <div className="space-y-2 mb-5 text-xs text-fg-muted">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <ChatCircle className="text-blue-500" />
            <span>Novas mensagens de compradores</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <CheckCircle className="text-green-500" />
            <span>Anúncio aprovado ou rejeitado</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <Tag className="text-accent" />
            <span>Novos carros que correspondem à sua pesquisa</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            tipo="secundario"
            onClick={onDismiss}
            className="flex-1"
          >
            Agora não
          </Button>
          <Button
            tipo="primario"
            icone={<Bell />}
            onClick={handleAccept}
            disabled={loading}
            carregando={loading}
            className="flex-1"
          >
            Sim, ativar
          </Button>
        </div>
      </div>
    </div>
  );
}
