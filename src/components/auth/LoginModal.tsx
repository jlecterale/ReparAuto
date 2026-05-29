'use client';

import { GoogleLogo, WarningCircle, Eye, EyeSlash } from '@phosphor-icons/react';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useApp } from '@/providers/AppProvider';
import { useToast } from '@/components/ui/Toast';

interface LoginModalProps {
  show: boolean;
  onClose: () => void;
}

export default function LoginModal({ show, onClose }: LoginModalProps) {
  const { auth } = useApp();
  const { login, registar, loginGoogle } = auth;
  const toast = useToast();

  const [modo, setModo] = useState<'login' | 'registar'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

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
    if (password.length < 6) {
      setErro('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
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
    } catch (err: any) {
      const msg = traduzirErroFirebase(err.code);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} titulo={modo === 'login' ? 'Entrar na Plataforma' : 'Criar Conta'} tamanho="sm">
      <div className="space-y-4">
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
        />

        <Input
          label="Palavra-passe"
          name="password"
          type={showPassword ? 'text' : 'password'}
          autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
          placeholder="Mínimo 6 caracteres"
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

        {erro && (
          <Alert tipo="erro" icone={<WarningCircle />} className="!p-3 !rounded-lg !items-center font-semibold">
            {erro}
          </Alert>
        )}

        <Button
          tipo="primario"
          tamanho="lg"
          blocoCompleto
          carregando={loading}
          disabled={loading || !email.trim() || !password.trim()}
          onClick={handleSubmit}
        >
          {modo === 'login' ? 'Entrar' : 'Criar Conta'}
        </Button>

        <p className="text-sm text-fg-subtle text-center">
          {modo === 'login' ? (
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
