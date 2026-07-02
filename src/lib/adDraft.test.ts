import {
  saveAdDraft,
  loadAdDraft,
  clearAdDraft,
  hasCarDraftContent,
  hasPartDraftContent,
  hasWorkshopDraftContent,
  hasIntentDraftContent,
} from '@/lib/adDraft';
import type { CarroFormData } from '@/types/carro';

// jest.setup.ts clears localStorage before each test, so every case starts fresh.

const carData = { marca: 'BMW', modelo: '320d', preco: '15000' };

describe('ad draft persistence', () => {
  it('returns null when no draft was saved', () => {
    expect(loadAdDraft('carro', 'uid1')).toBeNull();
  });

  it('round-trips a car draft with its wizard step', () => {
    saveAdDraft('carro', carData, { uid: 'uid1', step: 2 });
    const draft = loadAdDraft<typeof carData>('carro', 'uid1');
    expect(draft?.data).toEqual(carData);
    expect(draft?.step).toBe(2);
  });

  it('stamps the draft with the save time', () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date('2026-07-01T10:00:00Z'));
      saveAdDraft('carro', carData, { uid: 'uid1' });
      expect(loadAdDraft('carro', 'uid1')?.savedAt).toBe(
        new Date('2026-07-01T10:00:00Z').getTime(),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps car and part drafts independent', () => {
    saveAdDraft('carro', carData, { uid: 'uid1' });
    saveAdDraft('peca', { titulo: 'Farol' }, { uid: 'uid1' });
    clearAdDraft('carro');
    expect(loadAdDraft('carro', 'uid1')).toBeNull();
    expect(loadAdDraft<{ titulo: string }>('peca', 'uid1')?.data.titulo).toBe('Farol');
  });

  it('round-trips workshop and purchase-intent drafts', () => {
    saveAdDraft('oficina', { nome: 'Auto Silva' }, { uid: 'uid1' });
    saveAdDraft('intencao', { form: { descricao: 'Golf' } }, { uid: 'uid1' });
    expect(loadAdDraft<{ nome: string }>('oficina', 'uid1')?.data.nome).toBe('Auto Silva');
    expect(loadAdDraft<{ form: { descricao: string } }>('intencao', 'uid1')?.data.form.descricao).toBe('Golf');
  });

  it('is cleared explicitly', () => {
    saveAdDraft('carro', carData, { uid: 'uid1' });
    clearAdDraft('carro');
    expect(loadAdDraft('carro', 'uid1')).toBeNull();
  });

  describe('ownership', () => {
    it('hides a draft owned by a different user', () => {
      saveAdDraft('carro', carData, { uid: 'uid1' });
      expect(loadAdDraft('carro', 'uid2')).toBeNull();
    });

    it('hides an owned draft from an anonymous visitor', () => {
      saveAdDraft('carro', carData, { uid: 'uid1' });
      expect(loadAdDraft('carro', null)).toBeNull();
    });

    it('shows an anonymous draft to anyone on this browser', () => {
      saveAdDraft('carro', carData, { uid: null });
      expect(loadAdDraft('carro', 'uid1')).not.toBeNull();
      expect(loadAdDraft('carro', null)).not.toBeNull();
    });
  });

  it('returns null for a corrupt stored value instead of throwing', () => {
    localStorage.setItem('reparauto_ad_draft_carro', 'not-json');
    expect(loadAdDraft('carro', 'uid1')).toBeNull();
  });

  it('returns null when the stored entry has no data object', () => {
    localStorage.setItem('reparauto_ad_draft_carro', JSON.stringify({ uid: 'uid1' }));
    expect(loadAdDraft('carro', 'uid1')).toBeNull();
  });
});

describe('hasCarDraftContent', () => {
  const empty = {
    marca: '', modelo: '', km: '', preco: '', descricao: '',
  } as CarroFormData;

  it('is false for an untouched form (prefilled contacts do not count)', () => {
    expect(hasCarDraftContent({ ...empty, vendedorEmail: 'a@b.pt', vendedorTelefone: '912' } as CarroFormData)).toBe(false);
  });

  it('is true once a meaningful field is filled', () => {
    expect(hasCarDraftContent({ ...empty, marca: 'BMW' } as CarroFormData)).toBe(true);
    expect(hasCarDraftContent({ ...empty, descricao: 'Bom estado' } as CarroFormData)).toBe(true);
  });
});

describe('hasPartDraftContent', () => {
  const empty = { titulo: '', preco: '', descricao: '', numeroOEM: '' };

  it('is false for an untouched form', () => {
    expect(hasPartDraftContent(empty, [])).toBe(false);
  });

  it('is true once a meaningful field or compatibility is added', () => {
    expect(hasPartDraftContent({ ...empty, titulo: 'Farol' }, [])).toBe(true);
    expect(hasPartDraftContent(empty, [{ marca: 'BMW' }])).toBe(true);
  });
});

describe('hasWorkshopDraftContent', () => {
  const empty = { nome: '', descricao: '', responsavel: '', morada: '' };

  it('is false for an untouched form', () => {
    expect(hasWorkshopDraftContent(empty, [])).toBe(false);
  });

  it('is true once a meaningful field or specialty is added', () => {
    expect(hasWorkshopDraftContent({ ...empty, nome: 'Auto Silva' }, [])).toBe(true);
    expect(hasWorkshopDraftContent(empty, ['mecanica_geral'])).toBe(true);
  });
});

describe('hasIntentDraftContent', () => {
  const empty = { categoria: null, descricao: '', criterios: { marca: '' } };

  it('is false for an untouched form', () => {
    expect(hasIntentDraftContent(empty)).toBe(false);
  });

  it('is true once a category, brand or description is set', () => {
    expect(hasIntentDraftContent({ ...empty, categoria: 'carro' })).toBe(true);
    expect(hasIntentDraftContent({ ...empty, criterios: { marca: 'VW' } })).toBe(true);
    expect(hasIntentDraftContent({ ...empty, descricao: 'Farol Clio' })).toBe(true);
  });
});
