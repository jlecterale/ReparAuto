import { getStatusFuncionamento } from '@/lib/hours';
import type { WorkingHours } from '@/types/oficina';

describe('getStatusFuncionamento', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return closed with placeholder description when workingHours is undefined', () => {
    const result = getStatusFuncionamento(undefined);
    expect(result.status).toBe('closed');
    expect(result.label).toBe('Horário indisponível');
  });

  it('should return 24h status when is24h is active', () => {
    const hours: WorkingHours = { is24h: true };
    const result = getStatusFuncionamento(hours);
    expect(result.status).toBe('24h');
    expect(result.label).toContain('24 Horas');
  });

  it('should return open or closed based on time for conventional schedule', () => {
    const hours: WorkingHours = {
      is24h: false,
      schedule: {
        seg: { closed: false, openTime: '08:00', closeTime: '18:00' },
        sab: { closed: true },
        dom: { closed: true },
      },
    };

    // Mock Monday at 10:00 AM (Day 1)
    jest.setSystemTime(new Date(2026, 6, 20, 10, 0, 0)); // July 20, 2026 is Monday
    let result = getStatusFuncionamento(hours);
    expect(result.status).toBe('open');
    expect(result.label).toBe('Aberto agora');

    // Mock Monday at 20:00 PM (Day 1)
    jest.setSystemTime(new Date(2026, 6, 20, 20, 0, 0));
    result = getStatusFuncionamento(hours);
    expect(result.status).toBe('closed');
    expect(result.label).toBe('Fechado');

    // Mock Saturday at 10:00 AM (Day 6) (Closed day)
    jest.setSystemTime(new Date(2026, 6, 25, 10, 0, 0)); // July 25, 2026 is Saturday
    result = getStatusFuncionamento(hours);
    expect(result.status).toBe('closed');
    expect(result.label).toBe('Fechado');
  });
});
