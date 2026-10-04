// All booking dates are plain 'YYYY-MM-DD' strings in Africa/Johannesburg time.
// SA has no DST, but we still avoid Date maths in local time: everything is done
// in UTC on midnight-anchored dates so a string round-trips exactly.

export const SA_TZ = "Africa/Johannesburg";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUtc(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function fromUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUtc(d);
}

/** Inclusive list of every date from start to end. */
export function expandRange(start: string, end: string): string[] {
  if (end < start) throw new Error(`Invalid range ${start} → ${end}`);
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Inclusive day count: collect Mon, return Wed = 3 days. */
export function dayCount(start: string, end: string): number {
  return Math.round((toUtc(end).getTime() - toUtc(start).getTime()) / 86_400_000) + 1;
}

/** Today's date in South Africa. */
export function todaySA(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Converts a picker's local Date into a 'YYYY-MM-DD' string without TZ drift. */
export function fromLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Converts a 'YYYY-MM-DD' string into a local Date (for the picker). */
export function toLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(date: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtc(date));
}

/** "25 Oct" */
export function formatDayMonth(date: string): string {
  return new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" }).format(toUtc(date));
}

/** "Sunday" */
export function formatWeekday(date: string): string {
  return new Intl.DateTimeFormat("en-ZA", { weekday: "long", timeZone: "UTC" }).format(toUtc(date));
}
