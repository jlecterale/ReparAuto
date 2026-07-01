import { SignIn, UserCircle, Heart } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

export default function ProfileLoggedOut({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl ring-1 ring-neutral-100 p-8 text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-5">
          <UserCircle size={48} weight="duotone" className="text-primary-600" />
        </div>

        <h2 className="text-2xl font-extrabold text-fg-heading">Área do Utilizador</h2>
        <p className="text-fg-subtle text-sm mt-2 mb-6 leading-relaxed">
          Faça login para gerir os seus anúncios e consultar favoritos de forma persistente.
        </p>

        <Button
          tipo="escuro"
          tamanho="lg"
          blocoCompleto
          onClick={onLogin}
          icone={<SignIn size={20} weight="bold" />}
        >
          Entrar ou Criar Conta
        </Button>

        <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-fg-subtle">
          <Heart size={14} weight="fill" className="text-accent" />
          Os seus favoritos ficam guardados na sua conta.
        </p>

        <p className="text-[11px] text-fg-subtle mt-4">
          Ao entrar, concorda com os Termos da RecarGarage.
        </p>
      </div>
    </div>
  );
}
