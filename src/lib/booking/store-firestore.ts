import "server-only";
import { FieldValue, Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { findConflicts } from "./availability";
import { BookingStateError, ConflictError, DuplicateReferenceError, SlugTakenError, type BookingStore } from "./store";
import { blockedDateId, holdLines, holdUnits, type BlockedDate, type Booking, type CartLine, type Hold, type Resource } from "./types";

// Firestore stores expiresAt as a Timestamp; the engine works in epoch ms.
function toBlockedDate(data: DocumentData): BlockedDate {
  const holds: Record<string, Hold> = {};
  for (const [ref, h] of Object.entries<DocumentData>(data.holds ?? {})) {
    holds[ref] = {
      qty: h.qty,
      status: h.status,
      expiresAt: h.expiresAt instanceof Timestamp ? h.expiresAt.toMillis() : (h.expiresAt ?? null),
    };
  }
  return { resourceId: data.resourceId, date: data.date, holds };
}

function toBooking(data: DocumentData): Booking {
  const ms = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : (v as number));
  const opt = (v: unknown) => (v == null ? undefined : ms(v));
  return {
    ...(data as Booking),
    createdAt: ms(data.createdAt),
    expiresAt: ms(data.expiresAt),
    confirmedAt: opt(data.confirmedAt),
    releasedAt: opt(data.releasedAt),
  };
}

function toResource(id: string, data: DocumentData): Resource {
  return { images: [], specs: [], ...data, id } as unknown as Resource;
}

export class FirestoreStore implements BookingStore {
  private fs: Firestore = db();

  async listResources(kind?: Resource["kind"]) {
    let q = this.fs.collection("resources").where("active", "==", true);
    if (kind) q = q.where("kind", "==", kind);
    const snap = await q.get();
    return snap.docs.map((d) => toResource(d.id, d.data())).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getResourceBySlug(slug: string) {
    const snap = await this.fs.collection("resources").where("slug", "==", slug).where("active", "==", true).limit(1).get();
    const d = snap.docs[0];
    return d ? toResource(d.id, d.data()) : null;
  }

  async getResources(ids: string[]) {
    const out = new Map<string, Resource>();
    if (!ids.length) return out;
    const snaps = await this.fs.getAll(...ids.map((id) => this.fs.collection("resources").doc(id)));
    for (const s of snaps) if (s.exists && s.data()?.active) out.set(s.id, toResource(s.id, s.data()!));
    return out;
  }

  async queryBlockedDates(resourceIds: string[], from: string, to: string) {
    const out = new Map<string, BlockedDate>();
    // `in` accepts up to 30 values.
    for (let i = 0; i < resourceIds.length; i += 30) {
      const snap = await this.fs
        .collection("blockedDates")
        .where("resourceId", "in", resourceIds.slice(i, i + 30))
        .where("date", ">=", from)
        .where("date", "<=", to)
        .get();
      for (const d of snap.docs) out.set(d.id, toBlockedDate(d.data()));
    }
    return out;
  }

  async commitEnquiry(lines: CartLine[], dates: string[], booking: Booking) {
    const resourcesCol = this.fs.collection("resources");
    const blockedCol = this.fs.collection("blockedDates");
    const bookingRef = this.fs.collection("bookings").doc(booking.reference);
    const expiresAt = Timestamp.fromMillis(booking.expiresAt);

    await this.fs.runTransaction(async (tx) => {
      const ids = lines.flatMap((l) => dates.map((d) => blockedDateId(l.resourceId, d)));
      const [existing, ...rest] = await tx.getAll(
        bookingRef,
        ...lines.map((l) => resourcesCol.doc(l.resourceId)),
        ...ids.map((id) => blockedCol.doc(id)),
      );
      if (existing.exists) throw new DuplicateReferenceError();

      const resourceSnaps = rest.slice(0, lines.length);
      const blockedSnaps = rest.slice(lines.length);
      const stock = Object.fromEntries(
        resourceSnaps.map((s) => [s.id, s.exists && s.data()?.active ? (s.data()!.stock as number) : 0]),
      );
      const docs = new Map<string, BlockedDate>();
      for (const s of blockedSnaps) if (s.exists) docs.set(s.id, toBlockedDate(s.data()!));

      const conflicts = findConflicts(lines, dates, stock, docs, Date.now());
      if (conflicts.length) throw new ConflictError(conflicts);

      for (const line of lines) {
        for (const date of dates) {
          tx.set(
            blockedCol.doc(blockedDateId(line.resourceId, date)),
            {
              resourceId: line.resourceId,
              date,
              holds: { [booking.reference]: { qty: line.qty, status: "held", expiresAt } },
            },
            { merge: true },
          );
        }
      }
      tx.create(bookingRef, {
        ...booking,
        createdAt: Timestamp.fromMillis(booking.createdAt),
        expiresAt,
      });
    });
  }

  async getBooking(reference: string) {
    const s = await this.fs.collection("bookings").doc(reference).get();
    return s.exists ? toBooking(s.data()!) : null;
  }

  // ── Admin ────────────────────────────────────────────────────

  async listAllResources() {
    const snap = await this.fs.collection("resources").get();
    return snap.docs.map((d) => toResource(d.id, d.data())).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async saveResource(resource: Resource) {
    const col = this.fs.collection("resources");
    await this.fs.runTransaction(async (tx) => {
      const sameSlug = await tx.get(col.where("slug", "==", resource.slug).limit(2));
      if (sameSlug.docs.some((d) => d.id !== resource.id)) throw new SlugTakenError();
      const { id, ...data } = resource;
      // Firestore rejects undefined; drop unset optional fields.
      tx.set(col.doc(id), JSON.parse(JSON.stringify(data)));
    });
  }

  async listBookings(limit = 200) {
    const snap = await this.fs.collection("bookings").orderBy("createdAt", "desc").limit(limit).get();
    return snap.docs.map((d) => toBooking(d.data()));
  }

  async listBookingsOverlapping(from: string, to: string) {
    // One range field per query: filter on endDate in Firestore, startDate in memory.
    const snap = await this.fs.collection("bookings").where("endDate", ">=", from).get();
    return snap.docs.map((d) => toBooking(d.data())).filter((b) => b.startDate <= to);
  }

  async confirmBooking(reference: string, by: string, now: number) {
    return this.fs.runTransaction(async (tx) => {
      const bookingRef = this.fs.collection("bookings").doc(reference);
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new BookingStateError("Booking not found.");
      const booking = toBooking(snap.data()!);
      if (booking.status !== "held") throw new BookingStateError(`This booking is already ${booking.status}.`);

      const dates = holdUnits(booking);
      const lines = holdLines(booking);
      const blockedCol = this.fs.collection("blockedDates");
      const ids = lines.flatMap((l) => dates.map((d) => blockedDateId(l.resourceId, d)));
      const snaps = await tx.getAll(
        ...lines.map((l) => this.fs.collection("resources").doc(l.resourceId)),
        ...ids.map((id) => blockedCol.doc(id)),
      );
      const stock = Object.fromEntries(snaps.slice(0, lines.length).map((s) => [s.id, (s.data()?.stock as number) ?? 0]));
      const docs = new Map<string, BlockedDate>();
      for (const s of snaps.slice(lines.length)) if (s.exists) docs.set(s.id, toBlockedDate(s.data()!));

      // The hold may have expired and the stock been taken since: check, ignoring our own hold.
      const conflicts = findConflicts(lines, dates, stock, docs, now, reference);
      if (conflicts.length) throw new ConflictError(conflicts);

      for (const line of lines) {
        for (const date of dates) {
          tx.set(
            blockedCol.doc(blockedDateId(line.resourceId, date)),
            { resourceId: line.resourceId, date, holds: { [reference]: { qty: line.qty, status: "confirmed", expiresAt: null } } },
            { merge: true },
          );
        }
      }
      tx.update(bookingRef, { status: "confirmed", confirmedAt: Timestamp.fromMillis(now), handledBy: by });
      return { ...booking, status: "confirmed" as const, confirmedAt: now, handledBy: by };
    });
  }

  async releaseBooking(reference: string, by: string, now: number) {
    return this.fs.runTransaction(async (tx) => {
      const bookingRef = this.fs.collection("bookings").doc(reference);
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new BookingStateError("Booking not found.");
      const booking = toBooking(snap.data()!);
      if (booking.status === "released") throw new BookingStateError("This booking is already released.");

      const blockedCol = this.fs.collection("blockedDates");
      for (const item of holdLines(booking)) {
        for (const date of holdUnits(booking)) {
          // Nested-object merge, not a dotted path: references contain hyphens.
          tx.set(blockedCol.doc(blockedDateId(item.resourceId, date)), { holds: { [reference]: FieldValue.delete() } }, { merge: true });
        }
      }
      tx.update(bookingRef, { status: "released", releasedAt: Timestamp.fromMillis(now), handledBy: by });
      return { ...booking, status: "released" as const, releasedAt: now, handledBy: by };
    });
  }
}
