/**
 * Calendar-day helpers for the professional dashboard's daily metric buckets.
 * Buckets are keyed by the day in Europe/Lisbon ('YYYY-MM-DD').
 */

const LISBON_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Lisbon',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 'YYYY-MM-DD' for an instant, in the Europe/Lisbon timezone. */
export function lisbonDateKey(date: Date = new Date()): string {
  // en-CA renders as ISO (YYYY-MM-DD); the timeZone option does the shift.
  return LISBON_DAY.format(date);
}

/**
 * The last `days` consecutive Lisbon calendar dates, oldest first, ending on
 * the reference instant's Lisbon day. Steps by calendar day (Date.UTC
 * arithmetic on the anchor date), not by 24h of epoch time — naive 24h
 * stepping skips a date after spring-forward and duplicates one after
 * fall-back when the reference time is near local midnight.
 */
export function lisbonDateWindow(days: number, from: Date = new Date()): string[] {
  const [y, m, d] = lisbonDateKey(from).split('-').map(Number);
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  }
  return keys;
}
