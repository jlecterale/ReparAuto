import { listingPhotosChanged, statusAfterOwnerEdit } from '@/lib/listingModeration';

describe('listingPhotosChanged', () => {
  it('reports no change when the photo set is identical', () => {
    expect(listingPhotosChanged(['a.jpg', 'b.jpg'], ['a.jpg', 'b.jpg'])).toBe(false);
  });

  it('reports no change when the same photos are only reordered', () => {
    expect(listingPhotosChanged(['a.jpg', 'b.jpg'], ['b.jpg', 'a.jpg'])).toBe(false);
  });

  it('reports a change when a photo is added', () => {
    expect(listingPhotosChanged(['a.jpg'], ['a.jpg', 'b.jpg'])).toBe(true);
  });

  it('reports a change when a photo is removed', () => {
    expect(listingPhotosChanged(['a.jpg', 'b.jpg'], ['a.jpg'])).toBe(true);
  });

  it('reports a change when a photo is replaced', () => {
    expect(listingPhotosChanged(['a.jpg', 'b.jpg'], ['a.jpg', 'c.jpg'])).toBe(true);
  });

  it('treats two empty listings as unchanged', () => {
    expect(listingPhotosChanged([], [])).toBe(false);
  });

  it('ignores null / undefined entries when comparing', () => {
    expect(listingPhotosChanged(['a.jpg', null], [undefined, 'a.jpg'])).toBe(false);
  });

  it('handles a single-photo listing (part) unchanged', () => {
    expect(listingPhotosChanged(['a.jpg'], ['a.jpg'])).toBe(false);
  });

  it('handles a single-photo listing (part) replaced', () => {
    expect(listingPhotosChanged(['a.jpg'], ['b.jpg'])).toBe(true);
  });
});

describe('statusAfterOwnerEdit', () => {
  it('keeps an approved listing approved when photos are unchanged', () => {
    expect(statusAfterOwnerEdit('aprovado', ['a.jpg'], ['a.jpg'])).toBe('aprovado');
  });

  it('re-queues an approved listing for review when photos change', () => {
    expect(statusAfterOwnerEdit('aprovado', ['a.jpg'], ['a.jpg', 'b.jpg'])).toBe('pendente');
  });

  it('keeps a still-pending listing pending when photos are unchanged', () => {
    expect(statusAfterOwnerEdit('pendente', ['a.jpg'], ['a.jpg'])).toBe('pendente');
  });

  it('keeps a rejected listing rejected when only text changes', () => {
    expect(statusAfterOwnerEdit('rejeitado', ['a.jpg'], ['a.jpg'])).toBe('rejeitado');
  });

  it('re-queues a rejected listing for review when photos change', () => {
    expect(statusAfterOwnerEdit('rejeitado', ['a.jpg'], ['b.jpg'])).toBe('pendente');
  });
});
