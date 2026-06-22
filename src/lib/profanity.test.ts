import { describe, it, expect } from '@jest/globals';
import { contemProfanity } from '@/lib/profanity';

describe('contemProfanity', () => {
  it('flags a banned Portuguese word', () => {
    expect(contemProfanity('isto é uma merda')).toBe(true);
  });

  it('sees through leetspeak obfuscation (3→e, 4→a)', () => {
    expect(contemProfanity('m3rd4')).toBe(true);
  });

  it('flags English profanity case-insensitively', () => {
    expect(contemProfanity('What the FUCK')).toBe(true);
  });

  it('passes clean listing text', () => {
    expect(contemProfanity('Vendo carro em bom estado')).toBe(false);
  });
});
