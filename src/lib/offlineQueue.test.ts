import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  enqueue,
  peekQueue,
  hasQueued,
  processQueue,
  type QueuedAction,
} from '@/lib/offlineQueue';

// jsdom provides a real localStorage; reset it between cases.
beforeEach(() => localStorage.clear());

describe('offline action queue', () => {
  it('starts empty', () => {
    expect(hasQueued()).toBe(false);
    expect(peekQueue()).toEqual([]);
  });

  it('enqueues an action and exposes it through peekQueue', () => {
    enqueue({ uid: 'u1', type: 'favorito_add', payload: { id: 'car1' } });

    const queued = peekQueue();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ uid: 'u1', type: 'favorito_add', payload: { id: 'car1' } });
    expect(queued[0].id).toEqual(expect.any(String));
    expect(hasQueued()).toBe(true);
  });

  it('filters by uid while always including anonymous (null) actions', () => {
    enqueue({ uid: 'u1', type: 'favorito_add', payload: {} });
    enqueue({ uid: 'u2', type: 'favorito_add', payload: {} });
    enqueue({ uid: null, type: 'mensagem', payload: {} });

    expect(peekQueue('u1')).toHaveLength(2); // u1 + anonymous
    expect(peekQueue('u2')).toHaveLength(2); // u2 + anonymous
  });

  it('drains successfully handled actions and keeps failures for a later retry', async () => {
    enqueue({ uid: 'u1', type: 'favorito_add', payload: { id: 'ok' } });
    enqueue({ uid: 'u1', type: 'favorito_remove', payload: { id: 'boom' } });

    // The sync handler is the system boundary — inject a fake one.
    const handler = jest.fn(async (action: QueuedAction) => {
      if ((action.payload as { id: string }).id === 'boom') throw new Error('still offline');
    });

    const { succeeded, failed } = await processQueue('u1', handler);

    expect(handler).toHaveBeenCalledTimes(2);
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const remaining = peekQueue('u1');
    expect(remaining).toHaveLength(1);
    expect((remaining[0].payload as { id: string }).id).toBe('boom');
  });
});
