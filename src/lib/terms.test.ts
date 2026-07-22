import { term } from '@/lib/terms';

// Plan 20: the same interface reads naturally in both markets — Portuguese
// users see "Telemóvel"/"Concelho", Brazilian users see "Celular"/"Cidade".

describe('term', () => {
  it('resolves a label for each market', () => {
    expect(term('phoneLabel', 'PT')).toBe('Telemóvel');
    expect(term('phoneLabel', 'BR')).toBe('Celular');
    expect(term('municipalityLabel', 'PT')).toBe('Concelho');
    expect(term('municipalityLabel', 'BR')).toBe('Cidade');
  });

  it('resolves the password vocabulary per market', () => {
    expect(term('passwordLabel', 'PT')).toBe('Palavra-passe');
    expect(term('passwordLabel', 'BR')).toBe('Senha');
    expect(term('passwordNoun', 'PT')).toBe('palavra-passe');
    expect(term('passwordNoun', 'BR')).toBe('senha');
    expect(term('forgotPasswordLink', 'BR')).toBe('Esqueceu a senha?');
  });

  it('resolves listing vocabulary per market', () => {
    expect(term('mileageLabel', 'PT')).toBe('Quilómetros');
    expect(term('mileageLabel', 'BR')).toBe('Quilometragem');
    expect(term('upholsteryLabel', 'BR')).toBe('Estofamento');
    expect(term('gearsLabel', 'BR')).toBe('Marchas');
    expect(term('exchangeLabel', 'PT')).toBe('Aceita retoma');
    expect(term('exchangeLabel', 'BR')).toBe('Aceita troca');
    expect(term('userFallbackName', 'PT')).toBe('Utilizador');
    expect(term('userFallbackName', 'BR')).toBe('Usuário');
  });
});
