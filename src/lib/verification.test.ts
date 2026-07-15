import { verificationTipoForConta } from './verification';

describe('verificationTipoForConta', () => {
  it('maps a professional account to a professional verification', () => {
    expect(verificationTipoForConta('profissional')).toBe('profissional');
  });

  it('maps a particular account to an identity verification', () => {
    expect(verificationTipoForConta('particular')).toBe('identidade');
  });

  it('defaults to an identity verification when the account type is unknown', () => {
    expect(verificationTipoForConta(undefined)).toBe('identidade');
  });
});
