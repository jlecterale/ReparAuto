'use client';

import { GoogleLogo, WarningCircle, Eye, EyeSlash, ArrowLeft, Sparkle, CheckCircle, Circle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { enviarEmailReset } from '@/lib/auth';
import { validatePassword, PASSWORD_RULES } from '@/lib/utils';

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  modoInicial?: 'login' | 'registar';
  contexto?: string;
}

export default function LoginModal({ show, onClose, onSuccess, modoInicial, contexto }: LoginModalProps) {
  const { auth } = useApp();
  const { login, registar, loginGoogle } = auth;
  const toast = useToast();

  const [modo, setModo] = useState<'login' | 'registar' | 'reset'>(modoInicial ?? 'login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Sync the active tab to the requested mode only when the modal OPENS, so an
  // onboarding-driven open lands on "Criar Conta" while a plain open stays on
  // login. Gating on the closed→open transition preserves a mid-session manual
  // switch even if another openLoginModal call changes modoInicial while open.
  const wasShown = useRef(false);
  useEffect(() => {
    if (show && !wasShown.current) {
      setModo(modoInicial ?? 'login');
      setErro('');
    }
    wasShown.current = show;
  }, [show, modoInicial]);

  const handleSubmit = async () => {
    setErro('');

    if (!email.trim() || !password.trim()) {
      setErro('Preencha o email e a palavra-passe.');
      return;
    }
    if (modo === 'registar' && !nome.trim()) {
      setErro('Preencha o nome completo.');
      return;
    }
    if (modo === 'registar') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErro(passwordError);
        return;
      }
    }

    setLoading(true);
    try {
      if (modo === 'login') {
        await login(email.trim(), password);
        toast?.sucesso('Login efetuado com sucesso!');
      } else {
        await registar(nome.trim(), email.trim(), password);
        toast?.sucesso('Conta criada com sucesso!');
      }
      setNome('');
      setEmail('');
      setPassword('');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = traduzirErroFirebase(err.code);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setErro('');
    if (!email.trim()) {
      setErro('Introduza o seu email para recuperar a palavra-passe.');
      return;
    }
    setLoading(true);
    try {
      await enviarEmailReset(email.trim());
      setEmailSent(true);
      toast?.sucesso('Email de recuperação enviado! Verifique a sua caixa de entrada.');
    } catch (err: any) {
      const msg = traduzirErroFirebase(err.code);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setErro('');
    try {
      await loginGoogle();
      toast?.sucesso('Login com Google efetuado!');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg = traduzirErroFirebase(err.code);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo={modo === 'reset' ? 'Recuperar Palavra-passe' : modo === 'login' ? 'Entrar na Plataforma' : 'Criar Conta'} tamanho="sm">
      <div className="space-y-4">
        {contexto && modo !== 'reset' && (
          <div className="flex items-start gap-2.5 rounded-xl bg-accent/10 border border-accent/20 p-3 text-sm text-fg">
            <Sparkle weight="fill" className="text-accent mt-0.5 shrink-0" />
            <span className="font-medium">{contexto}</span>
          </div>
        )}
        {modo !== 'reset' && (
          <>
            <Button
              tipo="secundario"
              tamanho="lg"
              blocoCompleto
              icone={<GoogleLogo className="text-red-500" />}
              carregando={loading}
              onClick={handleGoogle}
              disabled={loading}
            >
              Continuar com Google
            </Button>

            <div className="flex items-center gap-3 text-xs font-semibold text-fg-subtle">
              <hr className="flex-1 border-neutral-200" />
              <span>ou</span>
              <hr className="flex-1 border-neutral-200" />
            </div>
          </>
        )}

        {modo === 'registar' && (
          <Input
            label="Nome Completo"
            name="nome"
            type="text"
            autoComplete="name"
            placeholder="Ex: Carlos Santos"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        )}

        <Input
          label="Endereço de E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Ex: carlos@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (modo === 'reset') {
                handleReset();
              } else {
                handleSubmit();
              }
            }
          }}
        />

        {modo !== 'reset' && (
          <>
            <Input
              label="Palavra-passe"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
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

            {modo === 'registar' && password.length > 0 && (
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

            {modo === 'login' && (
              <p className="text-xs -mt-2">
                <button
                  type="button"
                  onClick={() => { setModo('reset'); setErro(''); setEmailSent(false); }}
                  className="text-accent hover:underline font-medium"
                >
                  Esqueceu-se da palavra-passe?
                </button>
              </p>
            )}
          </>
        )}

        {modo === 'reset' && emailSent && (
          <Alert tipo="sucesso" icone={<WarningCircle />} className="!p-3 !rounded-lg !items-center font-semibold">
            Email de recuperação enviado! Verifique a sua caixa de entrada (e a pasta de spam).
          </Alert>
        )}

        {erro && (
          <Alert tipo="erro" icone={<WarningCircle />} className="!p-3 !rounded-lg !items-center font-semibold">
            {erro}
          </Alert>
        )}

        {modo === 'reset' ? (
          <Button
            tipo="primario"
            tamanho="lg"
            blocoCompleto
            carregando={loading}
            disabled={loading || !email.trim() || emailSent}
            onClick={handleReset}
          >
            Enviar link de recuperação
          </Button>
        ) : (
          <Button
            tipo="primario"
            tamanho="lg"
            blocoCompleto
            carregando={loading}
            disabled={loading || !email.trim() || !password.trim() || (modo === 'registar' && validatePassword(password) !== null)}
            onClick={handleSubmit}
          >
            {modo === 'login' ? 'Entrar' : 'Criar Conta'}
          </Button>
        )}

        <p className="text-sm text-fg-subtle text-center">
          {modo === 'reset' ? (
            <button
              type="button"
              onClick={() => { setModo('login'); setErro(''); setEmailSent(false); }}
              className="text-accent font-bold hover:underline"
            >
              <ArrowLeft size={14} className="inline align-middle mr-1" />
              Voltar ao login
            </button>
          ) : modo === 'login' ? (
            <>
              Ainda não tem conta?{' '}
              <button onClick={() => { setModo('registar'); setErro(''); }} className="text-accent font-bold hover:underline">
                Registar-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button onClick={() => { setModo('login'); setErro(''); }} className="text-accent font-bold hover:underline">
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </Modal>
  );
}

function traduzirErroFirebase(code: string): string {
  const erros: Record<string, string> = {
    'auth/user-not-found': 'Utilizador não encontrado.',
    'auth/wrong-password': 'Palavra-passe incorreta.',
    'auth/invalid-credential': 'Email ou palavra-passe inválidos.',
    'auth/email-already-in-use': 'Este email já está registado.',
    'auth/weak-password': 'A palavra-passe é muito fraca.',
    'auth/invalid-email': 'O formato do email é inválido.',
    'auth/popup-closed-by-user': 'Janela de autenticação foi fechada.',
    'auth/cancelled-popup-request': 'Autenticação cancelada.',
    'auth/network-request-failed': 'Erro de rede. Verifique a sua ligação à internet.',
    'auth/too-many-requests': 'Demasiadas tentativas. Tente novamente mais tarde.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/operation-not-allowed': 'Operação não permitida. Contacte o suporte.',
  };
  return erros[code] || 'Ocorreu um erro. Tente novamente.';
}
