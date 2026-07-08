import { pickChangedFields } from '@/lib/changedFields';

// Edit forms submit every field of the listing. pickChangedFields is the
// filter that keeps Firestore updates down to the fields the user actually
// changed — an unchanged form must produce an empty update (no write at all).

describe('pickChangedFields', () => {
  it('drops fields whose value equals the original document', () => {
    const original = { marca: 'BMW', preco: 12000, km: 90000 };
    const updates = { marca: 'BMW', preco: 11500, km: 90000 };

    expect(pickChangedFields(original, updates)).toEqual({ preco: 11500 });
  });

  it('deep-compares arrays so a resubmitted identical list is not rewritten', () => {
    const original = { fotos: ['a.jpg', 'b.jpg'], features: ['gps'] };
    const updates = { fotos: ['a.jpg', 'b.jpg'], features: ['gps', 'ac'] };

    expect(pickChangedFields(original, updates)).toEqual({ features: ['gps', 'ac'] });
  });

  it('returns an empty object when nothing changed, so callers can skip the write', () => {
    const original = {
      marca: 'BMW',
      coordenadas: { lat: 41.1, lng: -8.6 },
      fotos: ['a.jpg'],
      bodyType: null,
    };

    expect(pickChangedFields(original, { ...original, fotos: ['a.jpg'] })).toEqual({});
  });

  it('drops undefined values — Firestore updateDoc rejects them', () => {
    const original = { marca: 'BMW', seats: 5 };
    const updates = { marca: 'Audi', seats: undefined };

    // toStrictEqual: a `seats: undefined` entry must not exist at all.
    expect(pickChangedFields(original, updates)).toStrictEqual({ marca: 'Audi' });
  });
});
