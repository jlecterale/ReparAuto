import { useState } from 'react';
import Modal from '@/components/ui/Modal';
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
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          <i className="fa-brands fa-google text-red-500"></i>
          {loading ? 'A carregar...' : 'Continuar com Google'}
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <hr className="flex-1 border-gray-200" />
          <span>ou</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        {modo === 'registar' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
            <input
              type="text"
              placeholder="Ex: Carlos Santos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Endereço de E-mail</label>
          <input
            type="email"
            placeholder="Ex: carlos@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Palavra-passe</label>
          <input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {erro && (
          <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <i className="fa-solid fa-circle-exclamation mr-1"></i> {erro}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email.trim() || !password.trim()}
          className={`w-full font-bold py-3 rounded-xl transition ${
            loading || !email.trim() || !password.trim()
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-accent hover:bg-accent-hover text-white'
          }`}
        >
          {loading ? 'A processar...' : modo === 'login' ? 'Entrar' : 'Criar Conta'}
        </button>

        <p className="text-xs text-gray-400 text-center">
          {modo === 'login' ? (
            <>
              Ainda não tem conta?{' '}
              <button onClick={() => { setModo('registar'); setErro(''); }} className="text-accent font-semibold hover:underline">
                Registar-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button onClick={() => { setModo('login'); setErro(''); }} className="text-accent font-semibold hover:underline">
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
