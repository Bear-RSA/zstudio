// South African public holidays (Public Holidays Act 36 of 1994) and the business-day
// rules built on them. Equipment is collected and returned on business days only, and
// weekends and public holidays aren't charged; studios are open Monday to Saturday but
// close on public holidays.

import { addDays, expandRange } from "./dates";

const FIXED: [mmdd: string, name: string][] = [
  ["01-01", "New Year's Day"],
  ["03-21", "Human Rights Day"],
  ["04-27", "Freedom Day"],
  ["05-01", "Workers' Day"],
  ["06-16", "Youth Day"],
  ["08-09", "National Women's Day"],
  ["09-24", "Heritage Day"],
  ["12-16", "Day of Reconciliation"],
  ["12-25", "Christmas Day"],
  ["12-26", "Day of Goodwill"],
];

/** One-off holidays the President declares (e.g. election days). 'YYYY-MM-DD' → name. */
const DECLARED: Record<string, string> = {};

/** Easter Sunday (anonymous Gregorian algorithm). */
function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const cache = new Map<number, Map<string, string>>();

/** Every public holiday in a year, including Mondays observed for Sunday holidays. */
export function holidaysIn(year: number): Map<string, string> {
  const hit = cache.get(year);
  if (hit) return hit;
  const out = new Map<string, string>(FIXED.map(([md, name]) => [`${year}-${md}`, name]));
  const easter = easterSunday(year);
  out.set(addDays(easter, -2), "Good Friday");
  out.set(addDays(easter, 1), "Family Day");
  for (const [date, name] of Object.entries(DECLARED)) if (date.startsWith(`${year}-`)) out.set(date, name);
  // A holiday on a Sunday moves its day off to the Monday.
  for (const [date, name] of [...out]) {
    const monday = addDays(date, 1);
    if (weekday(date) === 0 && !out.has(monday)) out.set(monday, `${name} (observed)`);
  }
  cache.set(year, out);
  return out;
}

/** 0 = Sunday … 6 = Saturday. */
export const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** The holiday's name, or null on an ordinary day. */
export function publicHoliday(date: string): string | null {
  return holidaysIn(Number(date.slice(0, 4))).get(date) ?? null;
}

export const isWeekend = (date: string) => weekday(date) === 0 || weekday(date) === 6;

/** Monday to Friday and not a public holiday: equipment can be collected or returned. */
export const isBusinessDay = (date: string) => !isWeekend(date) && !publicHoliday(date);

/** Days charged for an equipment booking: weekends and public holidays in the range are free. */
export function billableDays(start: string, end: string): number {
  return expandRange(start, end).filter(isBusinessDay).length;
}

/** The first business day after `date`: when gear collected through `date` comes back. */
export function nextBusinessDay(date: string): string {
  let d = addDays(date, 1);
  while (!isBusinessDay(d)) d = addDays(d, 1);
  return d;
}
