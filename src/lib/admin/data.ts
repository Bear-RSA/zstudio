import "server-only";
import { isActiveHold } from "@/lib/booking/availability";
import { addDays, todaySA } from "@/lib/booking/dates";
import { dayStartTimes, isOpenDay, slotKey } from "@/lib/booking/slots";
import { getStore } from "@/lib/booking/store";
import { blockedDateId, holdLines, PRODUCTION_TEAM_ID, type BlockedDate, type Booking, type Resource } from "@/lib/booking/types";

/** What staff see: a held booking past its expiry is "expired" (it no longer blocks stock). */
export type DisplayStatus = "awaiting" | "expired" | "confirmed" | "released";

export function displayStatus(b: Booking, now = Date.now()): DisplayStatus {
  if (b.status === "held") return b.expiresAt > now ? "awaiting" : "expired";
  if (b.status === "confirmed") return "confirmed";
  return "released";
}

/** Booked by the half hour: studio spaces and the production team. */
const isTimed = (r: Resource) => r.kind === "studio" || r.id === PRODUCTION_TEAM_ID;

export interface InventoryRow {
  resource: Resource;
  /**
   * Today, on confirmed (paid) bookings: units out (gear), paid seats on the workshop's date, or
   * half-hours booked (studio spaces and the production team).
   */
  confirmedToday: number;
  /** The same, held and awaiting payment. */
  heldToday: number;
  availableToday: number;
  /** True when the counts are half-hours, not units. */
  timed: boolean;
}

export async function getInventory(day = todaySA()): Promise<InventoryRow[]> {
  const store = await getStore();
  const resources = await store.listAllResources();
  // Gear is counted for `day`; each workshop for its own date (seats sold); timed resources per slot.
  const workshops = resources.filter((r) => r.kind === "workshop" && r.date);
  const timed = resources.filter(isTimed);
  const daily = resources.filter((r) => !workshops.includes(r) && !timed.includes(r) && r.kind !== "service");
  const times = dayStartTimes();
  const keysFor = (r: Resource) =>
    isTimed(r) ? times.map((t) => slotKey(day, t)) : [r.kind === "workshop" && r.date ? r.date : day];

  const docs = new Map<string, BlockedDate>();
  const batches = await Promise.all([
    daily.length ? store.queryBlockedDates(daily.map((r) => r.id), day, day) : new Map<string, BlockedDate>(),
    timed.length ? store.queryBlockedDates(timed.map((r) => r.id), slotKey(day, times[0]), slotKey(day, times.at(-1)!)) : new Map<string, BlockedDate>(),
    ...workshops.map((w) => store.queryBlockedDates([w.id], w.date!, w.date!)),
  ]);
  for (const batch of batches) for (const [id, doc] of batch) docs.set(id, doc);

  const now = Date.now();
  const open = isOpenDay(day);
  return resources.map((resource) => {
    let confirmedToday = 0;
    let heldToday = 0;
    for (const key of keysFor(resource)) {
      for (const hold of Object.values(docs.get(blockedDateId(resource.id, key))?.holds ?? {})) {
        if (!isActiveHold(hold, now)) continue;
        // A slot counts once however many units it holds (the team may have several crews).
        const n = isTimed(resource) ? 1 : hold.qty;
        if (hold.status === "confirmed") confirmedToday += n;
        else heldToday += n;
      }
    }
    const capacity = !resource.active ? 0 : isTimed(resource) ? (open ? times.length : 0) : resource.stock;
    return {
      resource,
      confirmedToday,
      heldToday,
      availableToday: Math.max(0, capacity - confirmedToday - heldToday),
      timed: isTimed(resource),
    };
  });
}

export interface ScheduleEntry {
  reference: string;
  startTime: string;
  endTime: string;
  /** "Photoshoots · 1 hour" or "White Studio hire". */
  what: string;
  customer: string;
  status: DisplayStatus;
}

/** Each studio space and the production team, with its bookings on `day` in time order. */
export async function getStudioSchedule(day = todaySA()): Promise<{ resource: Resource; entries: ScheduleEntry[] }[]> {
  const store = await getStore();
  const now = Date.now();
  const [resources, bookings] = await Promise.all([store.listAllResources(), store.listBookingsOverlapping(day, day)]);
  const live = bookings.filter((b) => b.slots?.length && b.startTime && ["awaiting", "confirmed"].includes(displayStatus(b, now)));
  return resources
    .filter((r) => r.active && isTimed(r))
    .map((resource) => ({
      resource,
      entries: live
        .filter((b) => holdLines(b).some((l) => l.resourceId === resource.id))
        .map((b) => ({
          reference: b.reference,
          startTime: b.startTime!,
          endTime: b.endTime ?? "",
          what: b.service ? b.items[0].name : `${b.items[0].name} hire`,
          customer: b.customer.fullName,
          status: displayStatus(b, now),
        }))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }));
}

export async function getOverview() {
  const store = await getStore();
  const now = Date.now();
  const today = todaySA();
  const weekEnd = addDays(today, 6);
  const [bookings, inventory, thisWeek, schedule] = await Promise.all([
    store.listBookings(200),
    getInventory(today),
    store.listBookingsOverlapping(today, weekEnd),
    getStudioSchedule(today),
  ]);

  const awaiting = bookings.filter((b) => displayStatus(b, now) === "awaiting").sort((a, b) => a.expiresAt - b.expiresAt);
  const expired = bookings.filter((b) => displayStatus(b, now) === "expired");
  const upcoming = thisWeek
    .filter((b) => b.status === "confirmed" || displayStatus(b, now) === "awaiting")
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  const gear = inventory.filter((r) => r.resource.kind === "equipment" && r.resource.active);
  const rooms = inventory.filter((r) => r.resource.kind === "studio" && r.resource.active);

  return {
    awaiting,
    expiredCount: expired.length,
    upcoming,
    awaitingTotal: awaiting.reduce((s, b) => s + b.total, 0),
    unitsOutToday: gear.reduce((s, r) => s + r.confirmedToday + r.heldToday, 0),
    unitsTotal: gear.reduce((s, r) => s + r.resource.stock, 0),
    /** Half-hours across all studio spaces today. */
    studioToday: {
      booked: rooms.reduce((s, r) => s + r.confirmedToday, 0),
      held: rooms.reduce((s, r) => s + r.heldToday, 0),
      capacity: rooms.reduce((s, r) => s + r.confirmedToday + r.heldToday + r.availableToday, 0),
    },
    schedule,
  };
}
