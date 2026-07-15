import { getIntencaoCompra } from '@/lib/db';
import { updateDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

// firestore.rules only allow the stats-map bump on intencoes_compra for
// authenticated users, so firing it for anonymous visitors is a
// guaranteed-denied write on every public intent view. The read must still
// work for everyone; the bump only goes out when someone is signed in.
// (Separate file from db.test.ts to merge cleanly with the perf branch.)

jest.mock('firebase/firestore', () => ({
  collection: (_db: unknown, name: string) => ({ path: name }),
  doc: (dbOrCollection: { path?: string }, ...segments: string[]) =>
    segments.length > 0
      ? { path: segments.join('/') }
      : { path: `${dbOrCollection.path}/auto-id` },
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn().mockImplementation(async () => ({
    id: 'i1',
    exists: () => true,
    data: () => ({ titulo: 'Procuro carro' }),
  })),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  increment: jest.fn((n: number) => ({ __op: 'increment', n })),
  writeBatch: jest.fn(),
  Timestamp: class MockTimestamp {
    static now() {
      return { toMillis: () => 0 };
    }
    static fromMillis(ms: number) {
      return { toMillis: () => ms };
    }
  },
}));
jest.mock('./firebase', () => ({ db: {}, storage: {}, auth: { currentUser: null } }));
jest.mock('firebase/storage', () => ({ ref: jest.fn(), deleteObject: jest.fn() }));

// The mocked auth object is mutated per test to simulate the session state.
const mockAuth = auth as unknown as { currentUser: { uid: string } | null };

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.currentUser = null;
});

describe('getIntencaoCompra', () => {
  it('devolve a intenção sem tentar o bump de stats quando não há sessão iniciada', async () => {
    const result = await getIntencaoCompra('i1');

    expect(result).toEqual({ id: 'i1', titulo: 'Procuro carro' });
    expect(updateDoc).not.toHaveBeenCalled();
  });

  it('incrementa as visualizações quando há um utilizador autenticado', async () => {
    mockAuth.currentUser = { uid: 'u1' };

    await getIntencaoCompra('i1');

    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'intencoes_compra/i1' },
      {
        'stats.visualizacoes': { __op: 'increment', n: 1 },
        'stats.visualizacoes7Dias': { __op: 'increment', n: 1 },
      },
    );
  });
});
