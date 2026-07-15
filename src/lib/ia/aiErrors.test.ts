import { mapAiErrorToMessage } from '@/lib/ia/aiErrors';

function callableError(code: string): Error {
  const err = new Error(`Firebase: Error (functions/${code}).`);
  (err as Error & { code?: string }).code = `functions/${code}`;
  return err;
}

describe('mapAiErrorToMessage', () => {
  it('maps quota exhaustion to the weekly-limit message', () => {
    expect(mapAiErrorToMessage(callableError('resource-exhausted'))).toMatch(/limite semanal/i);
  });

  it('maps unauthenticated to a login prompt', () => {
    expect(mapAiErrorToMessage(callableError('unauthenticated'))).toMatch(/sess[ãa]o|login/i);
  });

  it('maps blocked content to a moderation message', () => {
    expect(mapAiErrorToMessage(callableError('failed-precondition'))).toMatch(/imagem|conte[úu]do/i);
  });

  it('never exposes raw provider errors for unknown failures', () => {
    const msg = mapAiErrorToMessage(new Error('INTERNAL: Vertex AI quota exceeded for project reparauto-site'));
    expect(msg).not.toMatch(/vertex|internal|reparauto/i);
    expect(msg).toMatch(/tente novamente/i);
  });
});
