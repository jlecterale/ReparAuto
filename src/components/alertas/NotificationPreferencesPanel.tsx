'use client';

import { CircleNotch, ChatCircle, UserCircle, BellRinging, TrendDown, type Icon } from '@phosphor-icons/react';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { requestNotificationPermission } from '@/lib/fcm';
import { useToast } from '@/components/ui/Toast';
import useNotificationPreferences from '@/hooks/useNotificationPreferences';
import type { GrupoPreferencia } from '@/types/alertas';

interface NotificationPreferencesPanelProps {
  uid: string;
}

const GROUPS: { key: GrupoPreferencia; Icon: Icon; label: string; desc: string }[] = [
  { key: 'mensagem', Icon: ChatCircle, label: 'Mensagens', desc: 'Novas mensagens de compradores/vendedores' },
  { key: 'conta', Icon: UserCircle, label: 'Conta e anúncios', desc: 'Aprovações, rejeições e avisos da sua conta' },
  { key: 'alerta', Icon: BellRinging, label: 'Os meus alertas', desc: 'Novos anúncios que correspondem aos seus alertas' },
  { key: 'preco', Icon: TrendDown, label: 'Quedas de preço', desc: 'Quando um favorito baixa de preço' },
];

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-neutral-300'
      }`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

/**
 * Per-type × per-channel notification preferences (plan 3.1). The same
 * document is read by the Cloud Functions before creating in-app docs or
 * sending pushes, so muting here silences every delivery path.
 */
export default function NotificationPreferencesPanel({ uid }: NotificationPreferencesPanelProps) {
  const { prefs, loading, toggle } = useNotificationPreferences(uid);
  const toast = useToast();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <CircleNotch className="animate-spin text-accent text-xl" />
      </div>
    );
  }

  const handleToggle = async (grupo: GrupoPreferencia, channel: 'inApp' | 'push') => {
    const enabling = !prefs[grupo][channel];
    await toggle(grupo, channel);
    // First push opt-in also needs browser permission + a device token.
    if (channel === 'push' && enabling && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      const token = await requestNotificationPermission();
      if (token) {
        try {
          await setDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) }, { merge: true });
        } catch {}
      } else {
        toast?.info('Ative as notificações do navegador para receber push.');
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="hidden sm:flex items-center justify-end gap-6 pr-1 text-[11px] font-bold text-fg-muted uppercase tracking-wide">
        <span className="w-11 text-center">Na app</span>
        <span className="w-11 text-center">Push</span>
      </div>
      {GROUPS.map(({ key, Icon: GroupIcon, label, desc }) => (
        <div key={key} className="flex items-center justify-between gap-3 bg-neutral-50 rounded-xl p-3">
          <div className="flex items-center gap-3 min-w-0">
            <GroupIcon size={18} className="text-accent shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-fg-heading">{label}</p>
              <p className="text-xs text-fg-muted truncate">{desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <Switch
              checked={prefs[key].inApp}
              onChange={() => handleToggle(key, 'inApp')}
              label={`${label} — na app`}
            />
            <Switch
              checked={prefs[key].push}
              onChange={() => handleToggle(key, 'push')}
              label={`${label} — push`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
