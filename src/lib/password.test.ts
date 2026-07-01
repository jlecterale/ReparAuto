import { validatePassword, PASSWORD_RULES } from '@/lib/utils';

// Registration password policy (PR #28): at least 8 chars, one uppercase letter,
// one digit and one symbol. validatePassword returns the first failing rule's
// user-facing (Portuguese) message, or null when the password satisfies all of
// them. Rules are checked in a fixed order so the message is deterministic.

describe('validatePassword', () => {
  it('accepts a password meeting every rule', () => {
    expect(validatePassword('Abcdef1!')).toBeNull();
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('Ab1!')).toBe('A palavra-passe deve ter pelo menos 8 caracteres.');
  });

  it('rejects passwords without an uppercase letter', () => {
    expect(validatePassword('abcdef1!')).toBe(
      'A palavra-passe deve conter pelo menos uma letra maiúscula.',
    );
  });

  it('rejects passwords without a digit', () => {
    expect(validatePassword('Abcdefg!')).toBe(
      'A palavra-passe deve conter pelo menos um número.',
    );
  });

  it('rejects passwords without a symbol', () => {
    expect(validatePassword('Abcdefg1')).toBe(
      'A palavra-passe deve conter pelo menos um símbolo.',
    );
  });

  it('reports the length rule first when several rules fail', () => {
    // "ab1" fails length, uppercase and symbol — length wins.
    expect(validatePassword('ab1')).toBe('A palavra-passe deve ter pelo menos 8 caracteres.');
  });
});

// PASSWORD_RULES drives the live requirements checklist in the registration
// form; validatePassword is derived from it, so they can never drift apart.
describe('PASSWORD_RULES (live checklist source)', () => {
  it('every rule passes for a strong password', () => {
    expect(PASSWORD_RULES.every((rule) => rule.test('Abcdef1!'))).toBe(true);
  });

  it('each rule has a label for the checklist and a message for the error', () => {
    for (const rule of PASSWORD_RULES) {
      expect(rule.label).toBeTruthy();
      expect(rule.message).toBeTruthy();
    }
  });

  it('validatePassword passes exactly when all rules pass', () => {
    const strong = 'Abcdef1!';
    const weak = 'abc';
    expect(validatePassword(strong)).toBeNull();
    expect(PASSWORD_RULES.every((rule) => rule.test(strong))).toBe(true);
    expect(validatePassword(weak)).not.toBeNull();
    expect(PASSWORD_RULES.every((rule) => rule.test(weak))).toBe(false);
  });
});
