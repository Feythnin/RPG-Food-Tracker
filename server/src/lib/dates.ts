/**
 * Returns today's local date as "YYYY-MM-DD" string.
 * Uses the server's local timezone, not UTC.
 */
export function getLocalDateStr(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a UTC midnight Date object for the given local date string.
 * Used as a consistent date key for Prisma queries.
 */
export function toDateKey(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z');
}

/**
 * Returns the date key for today (local timezone).
 */
export function todayDateKey(): Date {
  return toDateKey(getLocalDateStr());
}

/**
 * Returns the date key for yesterday (local timezone).
 */
export function yesterdayDateKey(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(getLocalDateStr(d));
}
