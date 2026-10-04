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
}

let store: Promise<BookingStore> | undefined;

export function getStore(): Promise<BookingStore> {
  store ??= (async () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIRESTORE_EMULATOR_HOST) {
      const { FirestoreStore } = await import("./store-firestore");
      return new FirestoreStore();
    }
    // ZS_ALLOW_MEMORY_STORE=1 lets a local `next build`/`next start` run without Firebase.
    if (process.env.NODE_ENV === "production" && process.env.ZS_ALLOW_MEMORY_STORE !== "1") {
      throw new Error("Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON.");
    }
    const { MemoryStore } = await import("./store-memory");
    console.warn("[zstudio] Firebase not configured — using in-memory store (dev only).");
    return new MemoryStore();
  })();
  return store;
}
