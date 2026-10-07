import { publicHoliday, weekday } from "./holidays";

// Studio spaces are booked in 30-minute slots within opening hours. A slot is held like a
// day of equipment: one blockedDates doc per resource × slot, keyed 'YYYY-MM-DDTHH:MM'.

export const SLOT_MINUTES = 30;
/** Opening hours (Monday – Saturday). The last booking must end by CLOSE. */
export const OPEN = "08:00";
export const CLOSE = "17:00";
/** Part of a studio booking paid up front to secure it (non-refundable). */
export const DEPOSIT_RATE = 0.5;

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const fromMinutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function addMinutes(time: string, minutes: number): string {
  return fromMinutes(toMinutes(time) + minutes);
}

/** Every bookable start time in a day: 08:00, 08:30 … 16:30. */
export function dayStartTimes(): string[] {
  const out: string[] = [];
  for (let m = toMinutes(OPEN); m + SLOT_MINUTES <= toMinutes(CLOSE); m += SLOT_MINUTES) out.push(fromMinutes(m));
  return out;
}

/** Slots between a start time and closing. */
export function slotsUntilClose(start: string): number {
  return Math.floor((toMinutes(CLOSE) - toMinutes(start)) / SLOT_MINUTES);
}

export const slotKey = (date: string, time: string) => `${date}T${time}`;

/** The slot keys for `count` consecutive slots from `start`. */
export function slotKeys(date: string, start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => slotKey(date, addMinutes(start, i * SLOT_MINUTES)));
}

/** Closed on Sundays and public holidays. */
export function isOpenDay(date: string): boolean {
  return weekday(date) !== 0 && !publicHoliday(date);
}

/** "30 min", "1 hour", "1½ hours", "2 hours" */
export function formatDuration(slots: number): string {
  const minutes = slots * SLOT_MINUTES;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const half = minutes % 60 ? "½" : "";
  return `${hours}${half} ${hours === 1 && !half ? "hour" : "hours"}`;
}

/** "10:00 – 12:00" */
export const formatTimeRange = (start: string, slots: number) => `${start} – ${addMinutes(start, slots * SLOT_MINUTES)}`;

/** Current time in South Africa as 'HH:MM'. */
export function nowTimeSA(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
}
