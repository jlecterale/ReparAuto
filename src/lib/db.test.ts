import { eliminarDadosDoUtilizador } from '@/lib/db';

// Firestore is mocked at the boundary. The behavior under test: GDPR erasure
// must remove every user-owned document (plus the profile) using batched
// writes — not one sequential network round-trip per document.

type FakeRef = { path: string };
type FakeBatch = { delete: jest.Mock; commit: jest.Mock };

const getDocsMock = jest.fn();
const batches: FakeBatch[] = [];
let rejectMessageBatches = false;

jest.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ path: name }),
  doc: (dbOrCollection: { path?: string }, ...segments: string[]) =>
    segments.length > 0
      ? { path: segments.join('/') }
      : { path: `${dbOrCollection.path}/auto-id` },
  query: (col: { path: string }, ...constraints: unknown[]) => ({ path: col.path, constraints }),
  where: (field: string, op: string, value: unknown) => ({ field, op, value }),
  orderBy: jest.fn(),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  increment: jest.fn(),
  writeBatch: () => {
    const batch: FakeBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockImplementation(() =>
        // Mirrors production rules: message deletes are admin-only, so any
        // batch touching messages/* is rejected when the suite flags it.
        rejectMessageBatches &&
        batch.delete.mock.calls.some(([ref]: [FakeRef]) => ref.path.startsWith('messages/'))
          ? Promise.reject(new Error('permission-denied'))
          : Promise.resolve(),
      ),
    };
    batches.push(batch);
    return batch;
  },
  Timestamp: class MockTimestamp {
    static now() {
      return { toMillis: () => 0 };
    }
    static fromMillis(ms: number) {
      return { toMillis: () => ms };
    }
  },
}));
jest.mock('./firebase', () => ({ db: {}, storage: {} }));
jest.mock('firebase/storage', () => ({ ref: jest.fn(), deleteObject: jest.fn() }));

function refs(collection: string, ids: string[]): { docs: { ref: FakeRef }[] } {
  return { docs: ids.map((id) => ({ ref: { path: `${collection}/${id}` } })) };
}

/** Seeds getDocs per "<collection>|<whereField>" key; unmatched queries are empty. */
function mockQueryResults(results: Record<string, { docs: { ref: FakeRef }[] }>) {
  getDocsMock.mockImplementation(
    async (q: { path: string; constraints: { field: string }[] }) =>
      results[`${q.path}|${q.constraints[0]?.field}`] ?? { docs: [] },
  );
}

function deletedPaths(): string[] {
  return batches.flatMap((b) => b.delete.mock.calls.map(([ref]: [FakeRef]) => ref.path));
}

beforeEach(() => {
  jest.clearAllMocks();
  batches.length = 0;
  rejectMessageBatches = false;
});

describe('eliminarDadosDoUtilizador', () => {
  it('apaga anúncios, mensagens, intenções (por userId) e o perfil em batches', async () => {
    mockQueryResults({
      'cars|criadorUid': refs('cars', ['c1', 'c2']),
      'parts|criadorUid': refs('parts', ['p1']),
      'messages|participants': refs('messages', ['m1']),
      'intencoes_compra|userId': refs('intencoes_compra', ['i1']),
    });

    await eliminarDadosDoUtilizador('u1');

    expect(deletedPaths().sort()).toEqual([
      'cars/c1',
      'cars/c2',
      'intencoes_compra/i1',
      'messages/m1',
      'parts/p1',
      'users/u1',
    ]);
    // One batch for the messages attempt, one for everything the user owns.
    expect(batches).toHaveLength(2);
    batches.forEach((b) => expect(b.commit).toHaveBeenCalledTimes(1));
  });

  it('divide em vários batches quando há mais de 500 documentos', async () => {
    const manyIds = Array.from({ length: 501 }, (_, i) => `c${i}`);
    mockQueryResults({ 'cars|criadorUid': refs('cars', manyIds) });

    await eliminarDadosDoUtilizador('u1');

    // 501 cars + 1 profile = 502 deletes → two batches.
    expect(batches).toHaveLength(2);
    expect(deletedPaths()).toHaveLength(502);
    batches.forEach((b) => expect(b.commit).toHaveBeenCalledTimes(1));
  });

  it('conclui a eliminação (incluindo o perfil) mesmo quando apagar mensagens é negado pelas rules', async () => {
    rejectMessageBatches = true;
    mockQueryResults({
      'messages|participants': refs('messages', ['m1']),
      'cars|criadorUid': refs('cars', ['c1']),
    });

    await expect(eliminarDadosDoUtilizador('u1')).resolves.toBeUndefined();

    // The denied messages batch must not abort the rest of the erasure.
    const committed = batches
      .filter((b) => b.commit.mock.results.every((r) => r.type === 'return'))
      .flatMap((b) => b.delete.mock.calls.map(([ref]: [FakeRef]) => ref.path));
    expect(committed).toContain('users/u1');
    expect(committed).toContain('cars/c1');
  });

  it('não apaga duas vezes um documento devolvido por mais de uma query', async () => {
    const shared = refs('propostas', ['dup']);
    mockQueryResults({
      'propostas|compradorUid': shared,
      'propostas|vendedorUid': shared,
    });

    await eliminarDadosDoUtilizador('u1');

    const dupDeletes = deletedPaths().filter((p) => p === 'propostas/dup');
    expect(dupDeletes).toHaveLength(1);
  });
});
