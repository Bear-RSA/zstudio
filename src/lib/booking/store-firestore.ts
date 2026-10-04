import "server-only";
import { Timestamp, type DocumentData, type Firestore } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { findConflicts } from "./availability";
import { ConflictError, DuplicateReferenceError, type BookingStore } from "./store";
import { blockedDateId, type BlockedDate, type Booking, type CartLine, type Hold, type Resource } from "./types";

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
  return { ...(data as Booking), createdAt: ms(data.createdAt), expiresAt: ms(data.expiresAt) };
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
}
