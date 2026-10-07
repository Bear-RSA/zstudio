import "server-only";
import { findConflicts } from "./availability";
import { seedResources } from "./seed-data";
import { BookingStateError, ConflictError, DuplicateReferenceError, SlugTakenError, type BookingStore } from "./store";
import { blockedDateId, holdLines, holdUnits, type BlockedDate, type Booking, type CartLine, type Resource } from "./types";

export interface MemoryDb {
  resources: Map<string, Resource>;
  blocked: Map<string, BlockedDate>;
  bookings: Map<string, Booking>;
}

export const freshMemoryDb = (): MemoryDb => ({
  resources: new Map(seedResources.map((r) => [r.id, structuredClone(r)])),
  blocked: new Map(),
  bookings: new Map(),
});

// Survives Next dev hot reloads.
const g = globalThis as unknown as { __zsMemory?: MemoryDb };
if (g.__zsMemory && !g.__zsMemory.resources) g.__zsMemory = undefined; // shape from an older build
const shared = (g.__zsMemory ??= freshMemoryDb());

const clone = <T,>(v: T): T => structuredClone(v);

// Every method is synchronous between its reads and writes (single Node process), so each is atomic.
export class MemoryStore implements BookingStore {
  constructor(private db: MemoryDb = shared) {}

  async listResources(kind?: Resource["kind"]) {
    return [...this.db.resources.values()]
      .filter((r) => r.active && (!kind || r.kind === kind))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(clone);
  }

  async getResourceBySlug(slug: string) {
    const r = [...this.db.resources.values()].find((r) => r.slug === slug && r.active);
    return r ? clone(r) : null;
  }

  async getResources(ids: string[]) {
    const out = new Map<string, Resource>();
    for (const id of ids) {
      const r = this.db.resources.get(id);
      if (r?.active) out.set(id, clone(r));
    }
    return out;
  }

  async queryBlockedDates(resourceIds: string[], from: string, to: string) {
    const ids = new Set(resourceIds);
    const out = new Map<string, BlockedDate>();
    for (const [id, doc] of this.db.blocked) {
      if (ids.has(doc.resourceId) && doc.date >= from && doc.date <= to) out.set(id, clone(doc));
    }
    return out;
  }

  async commitEnquiry(lines: CartLine[], dates: string[], booking: Booking) {
    if (this.db.bookings.has(booking.reference)) throw new DuplicateReferenceError();
    const stock = Object.fromEntries(lines.map((l) => [l.resourceId, this.activeStock(l.resourceId)]));
    const conflicts = findConflicts(lines, dates, stock, this.db.blocked, Date.now());
    if (conflicts.length) throw new ConflictError(conflicts);

    for (const line of lines) {
      for (const date of dates) {
        const id = blockedDateId(line.resourceId, date);
        const doc = this.db.blocked.get(id) ?? { resourceId: line.resourceId, date, holds: {} };
        doc.holds[booking.reference] = { qty: line.qty, status: "held", expiresAt: booking.expiresAt };
        this.db.blocked.set(id, doc);
      }
    }
    this.db.bookings.set(booking.reference, clone(booking));
  }

  async getBooking(reference: string) {
    const b = this.db.bookings.get(reference);
    return b ? clone(b) : null;
  }

  // ── Admin ────────────────────────────────────────────────────

  async listAllResources() {
    return [...this.db.resources.values()].sort((a, b) => a.sortOrder - b.sortOrder).map(clone);
  }

  async saveResource(resource: Resource) {
    const clash = [...this.db.resources.values()].find((r) => r.slug === resource.slug && r.id !== resource.id);
    if (clash) throw new SlugTakenError();
    this.db.resources.set(resource.id, clone(resource));
  }

  async listBookings(limit = 200) {
    return [...this.db.bookings.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit).map(clone);
  }

  async listBookingsOverlapping(from: string, to: string) {
    return [...this.db.bookings.values()].filter((b) => b.endDate >= from && b.startDate <= to).map(clone);
  }

  async confirmBooking(reference: string, by: string, now: number) {
    const booking = this.db.bookings.get(reference);
    if (!booking) throw new BookingStateError("Booking not found.");
    if (booking.status !== "held") throw new BookingStateError(`This booking is already ${booking.status}.`);

    const dates = holdUnits(booking);
    const lines = holdLines(booking);
    // The hold may have expired and the stock been taken since: check, ignoring our own hold.
    const stock = Object.fromEntries(lines.map((l) => [l.resourceId, this.db.resources.get(l.resourceId)?.stock ?? 0]));
    const conflicts = findConflicts(lines, dates, stock, this.db.blocked, now, reference);
    if (conflicts.length) throw new ConflictError(conflicts);

    for (const line of lines) {
      for (const date of dates) {
        const id = blockedDateId(line.resourceId, date);
        const doc = this.db.blocked.get(id) ?? { resourceId: line.resourceId, date, holds: {} };
        doc.holds[reference] = { qty: line.qty, status: "confirmed", expiresAt: null };
        this.db.blocked.set(id, doc);
      }
    }
    Object.assign(booking, { status: "confirmed", confirmedAt: now, handledBy: by });
    return clone(booking);
  }

  async releaseBooking(reference: string, by: string, now: number) {
    const booking = this.db.bookings.get(reference);
    if (!booking) throw new BookingStateError("Booking not found.");
    if (booking.status === "released") throw new BookingStateError("This booking is already released.");

    for (const line of holdLines(booking)) {
      for (const date of holdUnits(booking)) {
        delete this.db.blocked.get(blockedDateId(line.resourceId, date))?.holds[reference];
      }
    }
    Object.assign(booking, { status: "released", releasedAt: now, handledBy: by });
    return clone(booking);
  }

  private activeStock(id: string) {
    const r = this.db.resources.get(id);
    return r?.active ? r.stock : 0;
  }
}
