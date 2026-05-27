import { useState } from 'react';
import type { Verification, VerificationInput, TipoVerificacao } from '@/types/verification';

interface VerificationRequestProps {
  uid: string;
  email: string;
  nome: string;
  nif?: string;
  verificado?: boolean;
  verification: Verification | null;
  loading: boolean;
  onSubmit: (data: VerificationInput) => Promise<void>;
}

export default function VerificationRequest({
  uid,
  email,
  nome,
  nif,
  verificado,
  verification,
  loading,
  onSubmit,
}: VerificationRequestProps) {
  const [tipo, setTipo] = useState<TipoVerificacao>('identidade');
  const [enviando, setEnviando] = useState(false);

  if (loading) return null;

  if (verificado) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <i className="fa-solid fa-circle-check text-blue-500 text-xl"></i>
        <div>
          <p className="font-semibold text-blue-900 text-sm">Conta Verificada</p>
          <p className="text-xs text-blue-600">A sua identidade foi verificada pela equipa ReparAuto.</p>
        </div>
      </div>
    );
  }

  if (verification) {
    const statusMap: Record<string, { cor: string; icon: string; texto: string }> = {
      pendente: { cor: 'bg-yellow-50 border-yellow-200', icon: 'fa-solid fa-clock text-yellow-500', texto: 'O seu pedido de verificação está em análise.' },
      aprovado: { cor: 'bg-green-50 border-green-200', icon: 'fa-solid fa-circle-check text-green-500', texto: 'O seu pedido foi aprovado!' },
      rejeitado: { cor: 'bg-red-50 border-red-200', icon: 'fa-solid fa-circle-xmark text-red-500', texto: 'O seu pedido foi rejeitado.' },
    };
    const status = statusMap[verification.status] || statusMap.pendente;

    return (
      <div className={`${status.cor} border rounded-xl p-4 flex items-center gap-3`}>
        <i className={`${status.icon} text-xl`}></i>
        <div>
          <p className="font-semibold text-brand-900 text-sm">Verificação {verification.status === 'pendente' ? 'em análise' : verification.status === 'aprovado' ? 'aprovada' : 'rejeitada'}</p>
          <p className="text-xs text-slate-600">{status.texto}</p>
          {verification.notasAdmin && (
            <p className="text-xs text-slate-500 mt-1 italic">Notas: {verification.notasAdmin}</p>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setEnviando(true);
    try {
      await onSubmit({
        uid,
        email,
        nome,
        tipo,
        nif: nif || undefined,
        status: 'pendente',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h4 className="font-bold text-brand-900 text-sm mb-2 flex items-center gap-2">
        <i className="fa-solid fa-shield-halved text-accent"></i>
        Verificar Conta
      </h4>
      <p className="text-xs text-slate-500 mb-3">
        Obtenha o selo de conta verificada para aumentar a confiança dos compradores.
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTipo('identidade')}
          className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg border transition ${
            tipo === 'identidade'
              ? 'border-accent bg-accent/5 text-accent'
              : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <i className="fa-solid fa-id-card mr-1"></i> Identidade
        </button>
        <button
          onClick={() => setTipo('profissional')}
          className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg border transition ${
            tipo === 'profissional'
              ? 'border-accent bg-accent/5 text-accent'
              : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <i className="fa-solid fa-store mr-1"></i> Profissional
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={enviando}
        className="w-full bg-accent hover:bg-accent-hover text-white font-bold text-xs py-2.5 rounded-lg transition disabled:opacity-50"
      >
        {enviando ? (
          <><i className="fa-solid fa-spinner fa-spin mr-1"></i> A enviar...</>
        ) : (
          <><i className="fa-solid fa-paper-plane mr-1"></i> Pedir Verificação</>
        )}
      </button>
    </div>
  );
}
