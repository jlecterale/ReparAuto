const QUEUE_KEY = 'offline_queue';

export interface QueuedAction {
  id: string;
  uid: string | null;
  type: 'favorito_add' | 'favorito_remove' | 'mensagem';
  payload: Record<string, unknown>;
  timestamp: number;
}

function getQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedAction[]) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
}

export function enqueue(action: Omit<QueuedAction, 'id' | 'timestamp'>) {
  const queue = getQueue();
  queue.push({
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
  });
  saveQueue(queue);
}

export function peekQueue(uid: string | null = null): QueuedAction[] {
  const queue = getQueue();
  return uid === null ? queue : queue.filter((a) => a.uid === uid || a.uid === null);
}

export function removeFromQueue(ids: string[]) {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  saveQueue(getQueue().filter((a) => !idSet.has(a.id)));
}

export async function processQueue(
  uid: string | null,
  handler: (action: QueuedAction) => Promise<void>,
): Promise<{ succeeded: string[]; failed: string[] }> {
  const actions = peekQueue(uid);
  const succeeded: string[] = [];
  const failed: string[] = [];
  for (const action of actions) {
    try {
      await handler(action);
      succeeded.push(action.id);
    } catch {
      failed.push(action.id);
    }
  }
  removeFromQueue(succeeded);
  return { succeeded, failed };
}

export function hasQueued(uid: string | null = null): boolean {
  return peekQueue(uid).length > 0;
}
