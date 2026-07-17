import type { Country } from '@/lib/country';

const COUNTRY_TZ: Record<Country, string> = {
  PT: 'Europe/Lisbon',
  BR: 'America/Sao_Paulo',
};

const DAY_FORMATS = new Map<Country, Intl.DateTimeFormat>();

function getDayFormat(country: Country): Intl.DateTimeFormat {
  let fmt = DAY_FORMATS.get(country);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: COUNTRY_TZ[country] || 'Europe/Lisbon',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    DAY_FORMATS.set(country, fmt);
  }
  return fmt;
}

/** 'YYYY-MM-DD' for an instant, in the country's timezone. */
export function lisbonDateKey(date: Date = new Date(), country: Country = 'PT'): string {
  // en-CA renders as ISO (YYYY-MM-DD); the timeZone option does the shift.
  return getDayFormat(country).format(date);
}

/**
 * The last `days` consecutive calendar dates, oldest first, ending on
 * the reference instant's day in the given country's timezone.
 */
export function lisbonDateWindow(days: number, from: Date = new Date(), country: Country = 'PT'): string[] {
  const [y, m, d] = lisbonDateKey(from, country).split('-').map(Number);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return keys;
}
