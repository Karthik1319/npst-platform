/*
 * Sample dates are relative to when the data is generated, so "due today",
 * "overdue" and "10 min ago" stay true whenever the demo is run.
 */
const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Calendar date `days` from `now` (negative = past), as YYYY-MM-DD. */
export function dateFrom(now: Date, days: number): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** Date-time `days` from `now` at a given local hour, as ISO 8601. */
export function dateTimeFrom(now: Date, days: number, hour = 10): string {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

/** Date-time `minutes` before `now`, as ISO 8601. */
export function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

/** Whole days from `from` to `to` (YYYY-MM-DD), inclusive. */
export function daysBetweenInclusive(from: string, to: string): number {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
