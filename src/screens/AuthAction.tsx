'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Circle,
  Eye,
  EyeSlash,
  LockKey,
  WarningCircle,
} from '@phosphor-icons/react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { verifyResetCode, confirmNewPassword } from '@/lib/auth';
import { PASSWORD_RULES, validatePassword } from '@/lib/utils';

// Firebase's stock hosted handler. Every mode this screen doesn't implement
// (verifyEmail, recoverEmail, …) is forwarded there so pointing the email
// templates' action URL at /auth/action never breaks those flows.
const DEFAULT_HANDLER_URL = 'https://reparauto-site.firebaseapp.com/__/auth/action';

type Stage = 'verifying' | 'form' | 'saving' | 'done' | 'invalid';

export default function AuthAction() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode') || '';
  const queryString = searchParams.toString();

  const [stage, setStage] = useState<Stage>('verifying');
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [erro, setErro] = useState('');

  const isReset = mode === 'resetPassword';

  useEffect(() => {
    if (!isReset) {
      // Not ours to handle — hand off to the default Firebase page.
      window.location.replace(`${DEFAULT_HANDLER_URL}?${queryString}`);
      return;
    }
    let cancelled = false;
    verifyResetCode(oobCode)
      .then((email) => {
        if (cancelled) return;
        setAccountEmail(email);
        setStage('form');
      })
      .catch(() => {
        if (!cancelled) setStage('invalid');
      });
    return () => {
      cancelled = true;
    };
    // Depend on the query *values* (strings), not the useSearchParams object,
    // whose identity is not guaranteed stable across renders.
  }, [isReset, oobCode, queryString]);

  const passwordError = validatePassword(password);

  const handleSubmit = async () => {
    if (passwordError) return;
    setErro('');
    setStage('saving');
    try {
      await confirmNewPassword(oobCode, password);
      setStage('done');
    } catch {
      setErro('Não foi possível alterar a palavra-passe. Tente novamente.');
      setStage('form');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1 text-fg-strong">
          <LockKey size={22} className="text-accent" />
          <h1 className="text-xl font-black tracking-tight">Definir nova palavra-passe</h1>
        </div>

        {!isReset && (
          <p className="text-sm text-fg-muted mt-3">A redirecionar…</p>
        )}

        {isReset && stage === 'verifying' && (
          <p className="text-sm text-fg-muted mt-3">A validar o link…</p>
        )}

        {isReset && stage === 'invalid' && (
          <div className="mt-4 space-y-4">
            <Alert tipo="erro" icone={<WarningCircle />}>
              Este link expirou ou já foi usado. Peça um novo email de
              recuperação e tente outra vez.
            </Alert>
            <Link href="/" className="text-sm font-semibold text-accent hover:underline">
              Voltar à RecarGarage
            </Link>
          </div>
        )}

        {isReset && stage === 'done' && (
          <div className="mt-4 space-y-4">
            <Alert tipo="sucesso" icone={<CheckCircle />}>
              Palavra-passe alterada com sucesso! Já pode entrar com a nova
              palavra-passe.
            </Alert>
            <Link href="/" className="text-sm font-semibold text-accent hover:underline">
              Ir para o login
            </Link>
          </div>
        )}

        {isReset && (stage === 'form' || stage === 'saving') && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-fg-muted">
              Escolha uma nova palavra-passe para <strong>{accountEmail}</strong>.
            </p>

            <Input
              label="Nova palavra-passe"
              name="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              iconeFim={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-neutral-100 transition"
                  aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {password.length > 0 && (
              <div className="-mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const valid = rule.test(password);
                  return (
                    <div key={rule.label} className="flex items-center gap-1.5">
                      {valid ? (
                        <CheckCircle size={14} weight="fill" className="text-success-600 shrink-0" />
                      ) : (
                        <Circle size={14} className="text-neutral-400 shrink-0" />
                      )}
                      <span className={`text-xs ${valid ? 'text-success-600 font-medium' : 'text-fg-subtle'}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {erro && (
              <Alert tipo="erro" icone={<WarningCircle />} className="!p-3 !rounded-lg !items-center font-semibold">
                {erro}
              </Alert>
            )}

            <Button
              tipo="primario"
              tamanho="lg"
              blocoCompleto
              carregando={stage === 'saving'}
              disabled={stage === 'saving' || passwordError !== null}
              onClick={handleSubmit}
            >
              Guardar nova palavra-passe
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
