/**
 * Weekly quota window key, derived from SERVER time only (plan 4.1 §2.2):
 * the client never supplies the window — a tampered client must not be able
 * to write into a different week.
 */
export function weekKeyFromDate(date: Date): string {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  utc.setUTCDate(utc.getUTCDate() - diffToMonday);
  return `w-${utc.toISOString().slice(0, 10)}`;
}
