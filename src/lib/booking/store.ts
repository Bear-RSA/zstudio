import "server-only";
import type { BlockedDate, Booking, CartLine, Resource } from "./types";
import type { Conflict } from "./availability";

export class ConflictError extends Error {
  constructor(public conflicts: Conflict[]) {
    super("Some items are no longer available for the selected dates.");
    this.name = "ConflictError";
  }
}

export class DuplicateReferenceError extends Error {}

/** A dashboard action that doesn't fit the booking's current state (e.g. confirming a released booking). */
export class BookingStateError extends Error {}

export class SlugTakenError extends Error {}

/**
 * Storage boundary for the booking engine. Firestore in production; an
 * in-memory store for local development when Firebase isn't configured.
 */
export interface BookingStore {
  listResources(kind?: Resource["kind"]): Promise<Resource[]>;
  getResourceBySlug(slug: string): Promise<Resource | null>;
  getResources(ids: string[]): Promise<Map<string, Resource>>;
  /**
   * blockedDates docs for these resources with from <= date <= to, keyed by doc id.
   * A range on one field plus `in` on another — Firestore handles this with a
   * composite index, and only reads docs that exist.
   */
  queryBlockedDates(resourceIds: string[], from: string, to: string): Promise<Map<string, BlockedDate>>;
  /**
   * Atomically: re-check availability for every line × date, then write the
   * holds and create the booking. Throws ConflictError or DuplicateReferenceError.
   */
  commitEnquiry(lines: CartLine[], dates: string[], booking: Booking): Promise<void>;
  getBooking(reference: string): Promise<Booking | null>;

  // ── Admin dashboard ──────────────────────────────────────────
  /** Every resource, including inactive ones, sorted by sortOrder. */
  listAllResources(): Promise<Resource[]>;
  /** Create or update. Throws SlugTakenError if another resource of any kind uses the slug. */
  saveResource(resource: Resource): Promise<void>;
  /** Newest first. */
  listBookings(limit?: number): Promise<Booking[]>;
  /** Bookings whose date range overlaps [from, to]. */
  listBookingsOverlapping(from: string, to: string): Promise<Booking[]>;
  /**
   * Mark a held booking paid: its holds become permanent. If the hold had expired, re-checks
   * that nobody else has taken the stock since (ConflictError). Returns the updated booking.
   */
  confirmBooking(reference: string, by: string, now: number): Promise<Booking>;
  /** Cancel a held or confirmed booking and free its dates/seats. */
  releaseBooking(reference: string, by: string, now: number): Promise<Booking>;
}

let store: Promise<BookingStore> | undefined;

export function getStore(): Promise<BookingStore> {
  store ??= (async () => {
    const { isFirebaseConfigured } = await import("@/lib/firebase/admin");
    if (isFirebaseConfigured()) {
      const { FirestoreStore } = await import("./store-firestore");
      return new FirestoreStore();
    }
    // ZS_ALLOW_MEMORY_STORE=1 lets a local `next build`/`next start` run without Firebase.
    const { isDemoMode } = await import("@/lib/demo");
    if (process.env.NODE_ENV === "production" && process.env.ZS_ALLOW_MEMORY_STORE !== "1" && !isDemoMode()) {
      throw new Error(
        "No database configured. For a client preview, set the environment variable DEMO_MODE=1 " +
          "(Vercel: Settings → Environment Variables, then redeploy). To go live, set FIREBASE_SERVICE_ACCOUNT_JSON.",
      );
    }
    const { MemoryStore } = await import("./store-memory");
    console.warn(`[zstudio] Firebase not configured — using in-memory store (${isDemoMode() ? "DEMO_MODE preview" : "dev only"}).`);
    return new MemoryStore();
  })();
  return store;
}
