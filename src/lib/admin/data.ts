import "server-only";
import { isActiveHold } from "@/lib/booking/availability";
import { addDays, todaySA } from "@/lib/booking/dates";
import { getStore } from "@/lib/booking/store";
import { blockedDateId, type BlockedDate, type Booking, type Resource } from "@/lib/booking/types";

/** What staff see: a held booking past its expiry is "expired" (it no longer blocks stock). */
export type DisplayStatus = "awaiting" | "expired" | "confirmed" | "released";

export function displayStatus(b: Booking, now = Date.now()): DisplayStatus {
  if (b.status === "held") return b.expiresAt > now ? "awaiting" : "expired";
  if (b.status === "confirmed") return "confirmed";
  return "released";
}

export interface InventoryRow {
  resource: Resource;
  /** Units out today on confirmed (paid) bookings — for workshops, paid seats on the workshop date. */
  confirmedToday: number;
  /** Units held today, awaiting payment. */
  heldToday: number;
  availableToday: number;
}

export async function getInventory(day = todaySA()): Promise<InventoryRow[]> {
  const store = await getStore();
  const resources = await store.listAllResources();
  // Gear and the studio are counted for `day`; each workshop for its own date (seats sold).
  const dayOf = (r: Resource) => (r.kind === "workshop" && r.date ? r.date : day);
  const workshops = resources.filter((r) => r.kind === "workshop" && r.date);
  const others = resources.filter((r) => !workshops.includes(r));
  const docs = new Map<string, BlockedDate>();
  const batches = await Promise.all([
    others.length ? store.queryBlockedDates(others.map((r) => r.id), day, day) : new Map<string, BlockedDate>(),
    ...workshops.map((w) => store.queryBlockedDates([w.id], w.date!, w.date!)),
  ]);
  for (const batch of batches) for (const [id, doc] of batch) docs.set(id, doc);
  const now = Date.now();
  return resources.map((resource) => {
    let confirmedToday = 0;
    let heldToday = 0;
    for (const hold of Object.values(docs.get(blockedDateId(resource.id, dayOf(resource)))?.holds ?? {})) {
      if (!isActiveHold(hold, now)) continue;
      if (hold.status === "confirmed") confirmedToday += hold.qty;
      else heldToday += hold.qty;
    }
    const stock = resource.active ? resource.stock : 0;
    return { resource, confirmedToday, heldToday, availableToday: Math.max(0, stock - confirmedToday - heldToday) };
  });
}

export async function getOverview() {
  const store = await getStore();
  const now = Date.now();
  const today = todaySA();
  const weekEnd = addDays(today, 6);
  const [bookings, inventory, thisWeek] = await Promise.all([
    store.listBookings(200),
    getInventory(today),
    store.listBookingsOverlapping(today, weekEnd),
  ]);

  const awaiting = bookings.filter((b) => displayStatus(b, now) === "awaiting").sort((a, b) => a.expiresAt - b.expiresAt);
  const expired = bookings.filter((b) => displayStatus(b, now) === "expired");
  const upcoming = thisWeek
    .filter((b) => b.status === "confirmed" || displayStatus(b, now) === "awaiting")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const gear = inventory.filter((r) => r.resource.kind === "equipment" && r.resource.active);

  return {
    awaiting,
    expiredCount: expired.length,
    upcoming,
    awaitingTotal: awaiting.reduce((s, b) => s + b.total, 0),
    unitsOutToday: gear.reduce((s, r) => s + r.confirmedToday + r.heldToday, 0),
    unitsTotal: gear.reduce((s, r) => s + r.resource.stock, 0),
    studioToday: inventory.find((r) => r.resource.kind === "studio"),
  };
}
