import { listingPhotosAddedOrReplaced, statusAfterOwnerEdit } from '@/lib/listingModeration';

describe('listingPhotosAddedOrReplaced', () => {
  it('reports no change when the photo set is identical', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg', 'b.jpg'], ['a.jpg', 'b.jpg'])).toBe(false);
  });

  it('reports no change when the same photos are only reordered', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg', 'b.jpg'], ['b.jpg', 'a.jpg'])).toBe(false);
  });

  it('reports a change when a photo is added', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg'], ['a.jpg', 'b.jpg'])).toBe(true);
  });

  it('reports NO change when a photo is only removed', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg', 'b.jpg'], ['a.jpg'])).toBe(false);
  });

  it('reports no change when every photo is removed', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg', 'b.jpg'], [])).toBe(false);
  });

  it('reports a change when a photo is replaced', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg', 'b.jpg'], ['a.jpg', 'c.jpg'])).toBe(true);
  });

  it('reports a change when one photo is removed but another is added', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg', 'b.jpg'], ['a.jpg', 'c.jpg'])).toBe(true);
  });

  it('treats two empty listings as unchanged', () => {
    expect(listingPhotosAddedOrReplaced([], [])).toBe(false);
  });

  it('ignores null / undefined entries when comparing', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg', null], [undefined, 'a.jpg'])).toBe(false);
  });

  it('handles a single-photo listing (part) unchanged', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg'], ['a.jpg'])).toBe(false);
  });

  it('handles a single-photo listing (part) replaced', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg'], ['b.jpg'])).toBe(true);
  });

  it('handles a single-photo listing (part) removed', () => {
    expect(listingPhotosAddedOrReplaced(['a.jpg'], [])).toBe(false);
  });
});

describe('statusAfterOwnerEdit', () => {
  it('keeps an approved listing approved when photos are unchanged', () => {
    expect(statusAfterOwnerEdit('aprovado', ['a.jpg'], ['a.jpg'])).toBe('aprovado');
  });

  it('re-queues an approved listing for review when a photo is added', () => {
    expect(statusAfterOwnerEdit('aprovado', ['a.jpg'], ['a.jpg', 'b.jpg'])).toBe('pendente');
  });

  it('re-queues an approved listing for review when a photo is replaced', () => {
    expect(statusAfterOwnerEdit('aprovado', ['a.jpg'], ['b.jpg'])).toBe('pendente');
  });

  it('keeps an approved listing approved when a photo is only removed', () => {
    expect(statusAfterOwnerEdit('aprovado', ['a.jpg', 'b.jpg'], ['a.jpg'])).toBe('aprovado');
  });

  it('keeps a still-pending listing pending when photos are unchanged', () => {
    expect(statusAfterOwnerEdit('pendente', ['a.jpg'], ['a.jpg'])).toBe('pendente');
  });

  it('keeps a rejected listing rejected when only text changes', () => {
    expect(statusAfterOwnerEdit('rejeitado', ['a.jpg'], ['a.jpg'])).toBe('rejeitado');
  });

  it('re-queues a rejected listing for review when a photo is added', () => {
    expect(statusAfterOwnerEdit('rejeitado', ['a.jpg'], ['a.jpg', 'b.jpg'])).toBe('pendente');
  });
});
