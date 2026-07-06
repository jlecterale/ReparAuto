'use client';

import { CircleNotch, Info, LinkSimple, ListPlus, SignIn } from '@phosphor-icons/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import SegmentedControl from '@/components/ui/SegmentedControl';
import SingleImportPanel from '@/components/import/SingleImportPanel';
import BatchImportPanel from '@/components/import/BatchImportPanel';

type ImportMode = 'single' | 'batch';

/**
 * Import listings from Standvirtual (plan 24, wave 1 — paste-URL route).
 * Available to ANY signed-in account, particular or profissional.
 */
export default function ImportStandvirtual() {
  const router = useRouter();
  const { auth } = useApp();
  const { user, loading } = auth;

  const [mode, setMode] = useState<ImportMode>('single');
  const [attested, setAttested] = useState(false);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <CircleNotch className="animate-spin text-3xl text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-5 sm:p-8 page-enter">
        <div className="flex flex-col items-center justify-center text-center py-16 text-fg-muted">
          <SignIn size={40} className="text-neutral-300 mb-3" />
          <h2 className="text-xl font-extrabold text-fg-heading mb-1">Importar do Standvirtual</h2>
          <p className="text-sm mb-5">Inicie sessão para importar os seus anúncios.</p>
          <Button tipo="primario" onClick={() => router.push('/perfil')}>
            Iniciar sessão
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto page-enter">
      <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
        <h2 className="text-2xl font-extrabold text-fg-heading mb-1">Importar do Standvirtual</h2>
        <p className="text-fg-subtle text-sm mb-5">
          Traga os seus anúncios em minutos — dados, ficha técnica e fotos.
        </p>

        {user.emailVerified === false && (
          <Alert tipo="aviso" titulo="Email por confirmar" className="mb-5">
            Confirme o seu email (em Perfil) para poder importar anúncios.
          </Alert>
        )}

        <SegmentedControl<ImportMode>
          value={mode}
          onChange={setMode}
          ariaLabel="Modo de importação"
          options={[
            { value: 'single', label: 'Importar 1', icone: <LinkSimple /> },
            { value: 'batch', label: 'Importar vários', icone: <ListPlus /> },
          ]}
          className="mb-5"
        />

        {/* Ownership attestation — required before anything is fetched. */}
        <label className="flex items-start gap-2.5 bg-neutral-50 border border-neutral-200 rounded-xl p-3 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={attested}
            onChange={(e) => setAttested(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[--color-accent] shrink-0"
          />
          <span className="text-sm text-fg">
            Confirmo que {mode === 'single' ? 'este anúncio é meu' : 'estes anúncios são meus'} e
            que tenho os direitos sobre as fotografias.
          </span>
        </label>

        {mode === 'single' ? (
          <SingleImportPanel attested={attested} />
        ) : (
          <BatchImportPanel attested={attested} />
        )}

        <div className="mt-6 pt-4 border-t border-neutral-100">
          <p className="text-xs text-fg-muted flex items-start gap-1.5">
            <Info className="shrink-0 mt-0.5" />
            <span>
              Os contactos do anúncio vêm sempre do seu perfil RecarGarage (o telefone não é lido
              do Standvirtual). Os anúncios importados ficam pendentes até aprovação, como qualquer
              anúncio novo.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
