import { useState, useCallback } from 'react';
import { requestNotificationPermission } from '@/lib/fcm';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
            <i className="fa-solid fa-bell text-2xl text-accent"></i>
          </div>
          <h3 className="font-extrabold text-brand-900 text-lg">Ativar Notificações?</h3>
          <p className="text-sm text-slate-500 mt-2">
            Receba alertas quando receber mensagens sobre os seus anúncios ou quando anúncios do seu interesse forem publicados.
          </p>
        </div>

        <div className="space-y-2 mb-5 text-xs text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <i className="fa-solid fa-comment text-blue-500"></i>
            <span>Novas mensagens de compradores</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <i className="fa-solid fa-check-circle text-green-500"></i>
            <span>Anúncio aprovado ou rejeitado</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <i className="fa-solid fa-tag text-accent"></i>
            <span>Novos carros que correspondem à sua pesquisa</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Agora não
          </button>
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-accent hover:bg-accent-hover rounded-xl transition disabled:opacity-50"
          >
            {loading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : (
              <>
                <i className="fa-solid fa-bell mr-1"></i> Sim, ativar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
