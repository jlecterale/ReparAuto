import { collectSellerUids, prioritizeVerified, chunkArray } from '@/lib/sellers';

interface Item {
  id: string;
  criadorUid?: string;
}

const item = (id: string, criadorUid?: string): Item => ({ id, criadorUid });

describe('collectSellerUids', () => {
  it('returns unique uids preserving first-seen order', () => {
    const items = [item('a', 'u1'), item('b', 'u2'), item('c', 'u1'), item('d', 'u3')];
    expect(collectSellerUids(items)).toEqual(['u1', 'u2', 'u3']);
  });

  it('skips items without a criadorUid (legacy docs)', () => {
    const items = [item('a'), item('b', ''), item('c', 'u1')];
    expect(collectSellerUids(items)).toEqual(['u1']);
  });

  it('returns an empty array for an empty list', () => {
    expect(collectSellerUids([])).toEqual([]);
  });
});

describe('prioritizeVerified', () => {
  it('moves listings from verified sellers to the front, keeping relative order in both groups', () => {
    const items = [
      item('a', 'u1'),
      item('b', 'u2'),
      item('c', 'u1'),
      item('d', 'u3'),
      item('e', 'u2'),
    ];
    const result = prioritizeVerified(items, new Set(['u2']));
    expect(result.map((i) => i.id)).toEqual(['b', 'e', 'a', 'c', 'd']);
  });

  it('keeps the original order when no seller is verified', () => {
    const items = [item('a', 'u1'), item('b', 'u2')];
    expect(prioritizeVerified(items, new Set()).map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('treats items without criadorUid as not verified', () => {
    const items = [item('a'), item('b', 'u1')];
    const result = prioritizeVerified(items, new Set(['u1']));
    expect(result.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('does not mutate the input array', () => {
    const items = [item('a', 'u1'), item('b', 'u2')];
    prioritizeVerified(items, new Set(['u2']));
    expect(items.map((i) => i.id)).toEqual(['a', 'b']);
  });
});

describe('chunkArray', () => {
  it('splits an array into chunks of the given size', () => {
    expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('returns a single chunk when the array fits', () => {
    expect(chunkArray([1, 2], 30)).toEqual([[1, 2]]);
  });

  it('returns an empty array for an empty input', () => {
    expect(chunkArray([], 10)).toEqual([]);
  });
});
