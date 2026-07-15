import type { TipoConta, TipoVerificacao } from '@/types';

/**
 * The kind of verification that applies to an account is fixed by its account
 * type: professional accounts do a professional verification, everyone else an
 * identity one. Users don't choose this manually — the account type set at
 * signup decides it. Mirrors the web `src/lib/verification.ts`.
 */
export function verificationTipoForConta(tipoConta: TipoConta | undefined): TipoVerificacao {
  return tipoConta === 'profissional' ? 'profissional' : 'identidade';
}
