import { bodyTypeLabel, equipmentLabel, partCategoryLabel } from '@/lib/constants';

// Stored enum values are canonical (pt-PT era, shared across markets and with
// the mobile app — renaming them is a data-schema change); only the label the
// user sees varies by market. PT always sees the stored value unchanged.

describe('bodyTypeLabel', () => {
  it('shows Brazilian body-type names for BR', () => {
    expect(bodyTypeLabel('Citadino', 'BR')).toBe('Hatch');
    expect(bodyTypeLabel('Carrinha', 'BR')).toBe('Perua / SW');
    expect(bodyTypeLabel('Pick-up', 'BR')).toBe('Picape');
  });

  it('keeps the stored value for PT and for values without a BR variant', () => {
    expect(bodyTypeLabel('Citadino', 'PT')).toBe('Citadino');
    expect(bodyTypeLabel('SUV', 'BR')).toBe('SUV');
  });
});

describe('equipmentLabel', () => {
  it('shows Brazilian equipment names for BR', () => {
    expect(equipmentLabel('Câmara de marcha-atrás', 'BR')).toBe('Câmera de ré');
    expect(equipmentLabel('Fecho centralizado', 'BR')).toBe('Trava elétrica');
    expect(equipmentLabel('Jantes de liga leve', 'BR')).toBe('Rodas de liga leve');
  });

  it('keeps the stored value for PT and unmapped values', () => {
    expect(equipmentLabel('Câmara de marcha-atrás', 'PT')).toBe('Câmara de marcha-atrás');
    expect(equipmentLabel('Bluetooth', 'BR')).toBe('Bluetooth');
  });
});

describe('partCategoryLabel', () => {
  it('shows Brazilian part-category names for BR', () => {
    expect(partCategoryLabel('Suspensão e Travões', 'BR')).toBe('Suspensão e Freios');
    expect(partCategoryLabel('Carroçaria e Chaparia', 'BR')).toBe('Carroceria e Lataria');
  });

  it('keeps the stored value for PT and unmapped values', () => {
    expect(partCategoryLabel('Suspensão e Travões', 'PT')).toBe('Suspensão e Travões');
    expect(partCategoryLabel('Outros', 'BR')).toBe('Outros');
  });
});
