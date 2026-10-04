import "server-only";
import { findConflicts } from "./availability";
import { seedResources } from "./seed-data";
import { ConflictError, DuplicateReferenceError, type BookingStore } from "./store";
import { blockedDateId, type BlockedDate, type Booking, type CartLine, type Resource } from "./types";

export interface MemoryDb {
  blocked: Map<string, BlockedDate>;
  bookings: Map<string, Booking>;
}

// Survives Next dev hot reloads.
const g = globalThis as unknown as { __zsMemory?: MemoryDb };
const shared = (g.__zsMemory ??= { blocked: new Map(), bookings: new Map() });

const clone = <T,>(v: T): T => structuredClone(v);

export class MemoryStore implements BookingStore {
  private resources = new Map(seedResources.map((r) => [r.id, r]));

  constructor(private db: MemoryDb = shared) {}

  async listResources(kind?: Resource["kind"]) {
    return [...this.resources.values()]
      .filter((r) => r.active && (!kind || r.kind === kind))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getResourceBySlug(slug: string) {
    return [...this.resources.values()].find((r) => r.slug === slug && r.active) ?? null;
  }

  async getResources(ids: string[]) {
    const out = new Map<string, Resource>();
    for (const id of ids) {
      const r = this.resources.get(id);
      if (r?.active) out.set(id, r);
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

  // Single Node process, no awaits between read and write: this is atomic.
  async commitEnquiry(lines: CartLine[], dates: string[], booking: Booking) {
    if (this.db.bookings.has(booking.reference)) throw new DuplicateReferenceError();
    const stock = Object.fromEntries(lines.map((l) => [l.resourceId, this.resources.get(l.resourceId)?.stock ?? 0]));
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
}
