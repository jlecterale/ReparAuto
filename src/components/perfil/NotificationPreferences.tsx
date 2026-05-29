'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatCircle, CheckCircle, Car, type Icon } from '@phosphor-icons/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Preferences {
  mensagens: boolean;
  aprovacao: boolean;
  novosAnuncios: boolean;
}

const DEFAULT_PREFS: Preferences = {
  mensagens: true,
  aprovacao: true,
  novosAnuncios: false,
};

export default function NotificationPreferences({ uid }: { uid: string }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        const data = snap.data();
        if (data?.notifPrefs) {
          setPrefs({ ...DEFAULT_PREFS, ...data.notifPrefs });
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [uid]);

  const toggle = useCallback(async (key: keyof Preferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await setDoc(doc(db, 'users', uid), { notifPrefs: updated }, { merge: true });
    } catch {}
  }, [uid, prefs]);

  if (loading) return null;

  const items: { key: keyof Preferences; Icon: Icon; label: string; desc: string }[] = [
    { key: 'mensagens', Icon: ChatCircle, label: 'Mensagens', desc: 'Novas mensagens de compradores/vendedores' },
    { key: 'aprovacao', Icon: CheckCircle, label: 'Estado do anúncio', desc: 'Aprovação ou rejeição dos seus anúncios' },
    { key: 'novosAnuncios', Icon: Car, label: 'Novos anúncios', desc: 'Quando carros do seu interesse forem publicados' },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ key, Icon, label, desc }) => (
        <div key={key} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Icon size={18} className="text-accent shrink-0" />
            <div>
              <p className="text-sm font-semibold text-fg-heading">{label}</p>
              <p className="text-xs text-fg-subtle">{desc}</p>
            </div>
          </div>
          <button
            onClick={() => toggle(key)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${prefs[key] ? 'bg-accent' : 'bg-slate-300'}`}
            role="switch"
            aria-checked={prefs[key]}
            aria-label={label}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
