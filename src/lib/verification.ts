import type { TipoConta } from '@/types/usuario';
import type { TipoVerificacao } from '@/types/verification';

/**
 * The kind of verification that applies to an account is fixed by its account
 * type: professional accounts do a professional verification, everyone else an
 * identity one. Users don't choose this manually — the account type set at
 * signup decides it.
 */
export function verificationTipoForConta(tipoConta: TipoConta | undefined): TipoVerificacao {
  return tipoConta === 'profissional' ? 'profissional' : 'identidade';
}
