import { useCallback, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

/**
 * Shared "resend" / "I've verified" actions for the email-verification UI
 * (the global banner and the listing gate). Tracks in-flight state per action
 * and surfaces the result through toasts so the two surfaces stay consistent.
 */
export function useEmailVerification() {
  const { reenviarVerificacaoEmail, recarregarVerificacao } = useAuth();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);

  const reenviar = useCallback(async () => {
    setResending(true);
    try {
      await reenviarVerificacaoEmail();
      showToast('Email de verificação enviado. Verifique a sua caixa de entrada.', 'success');
    } catch {
      showToast('Não foi possível enviar o email. Tente novamente.', 'error');
    } finally {
      setResending(false);
    }
  }, [reenviarVerificacaoEmail, showToast]);

  const verificar = useCallback(async (): Promise<boolean> => {
    setChecking(true);
    try {
      const ok = await recarregarVerificacao();
      if (ok) {
        showToast('Email verificado. Obrigado!', 'success');
      } else {
        showToast('Ainda não confirmámos o seu email. Clique no link que lhe enviámos.', 'info');
      }
      return ok;
    } catch {
      showToast('Não foi possível verificar. Tente novamente.', 'error');
      return false;
    } finally {
      setChecking(false);
    }
  }, [recarregarVerificacao, showToast]);

  return { reenviar, verificar, resending, checking };
}
