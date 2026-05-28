import { useState, useEffect, useCallback } from 'react';
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

  const items: { key: keyof Preferences; icon: string; label: string; desc: string }[] = [
    { key: 'mensagens', icon: 'fa-comment', label: 'Mensagens', desc: 'Novas mensagens de compradores/vendedores' },
    { key: 'aprovacao', icon: 'fa-check-circle', label: 'Estado do anúncio', desc: 'Aprovação ou rejeição dos seus anúncios' },
    { key: 'novosAnuncios', icon: 'fa-car', label: 'Novos anúncios', desc: 'Quando carros do seu interesse forem publicados' },
  ];

  return (
    <div className="space-y-3">
      {items.map(({ key, icon, label, desc }) => (
        <div key={key} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <i className={`fa-solid ${icon} text-accent text-sm`}></i>
            <div>
              <p className="text-sm font-semibold text-brand-900">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
          </div>
          <button
            onClick={() => toggle(key)}
            className={`relative w-10 h-6 rounded-full transition ${prefs[key] ? 'bg-accent' : 'bg-slate-300'}`}
            role="switch"
            aria-checked={prefs[key]}
            aria-label={label}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-4.5' : 'translate-x-0.5'}`}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
