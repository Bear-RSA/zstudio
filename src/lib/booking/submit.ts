import "server-only";
import { business } from "@/lib/config";
import { isDemoMode } from "@/lib/demo";
import { sendEnquiryEmails } from "@/lib/email/send";
import { encodeDemoSummary } from "./demo-summary";
import { expandRange } from "./dates";
import { billableDays } from "./holidays";
import { quote, quoteSpace } from "./pricing";
import { generateReference } from "./reference";
import { ConflictError, DuplicateReferenceError, getStore } from "./store";
import type { Booking, CartLine, Customer, Quote, Resource } from "./types";

export type SubmitResult =
  | { ok: true; reference: string; /** DEMO_MODE only — see demo-summary.ts */ demo?: string }
  | { ok: false; error: string; conflicts?: { name: string; dates: string[] }[]; fieldErrors?: Record<string, string[]> };

/** Merge duplicate lines so availability is checked against the combined qty. */
export function normalise(lines: CartLine[]): CartLine[] {
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.resourceId, (merged.get(l.resourceId) ?? 0) + l.qty);
  return [...merged].map(([resourceId, qty]) => ({ resourceId, qty }));
}

/**
 * The shared tail of every booking: price on the server, hold stock/seats in one
 * transaction, create the reference, send the emails. Callers validate their own input.
 */
export async function submitBooking(args: {
  lines: CartLine[];
  resources: Map<string, Resource>;
  startDate: string;
  endDate: string;
  customer: Customer;
  details?: string;
  /** A timed booking (studio space or service): these consecutive half-hours on startDate. */
  space?: { slots: string[]; startTime: string; endTime: string };
  /**
   * A production service: the priced quote and booking details. `lines` are then what's held
   * (the team and a room), not what's charged.
   */
  service?: { quote: Quote; details: NonNullable<Booking["service"]> };
}): Promise<SubmitResult> {
  const { lines, resources, startDate, endDate, details, space, service } = args;
  const q = service
    ? service.quote
    : space
      ? quoteSpace(resources.get(lines[0].resourceId)!, space.slots.length)
      : quote(lines, resources, billableDays(startDate, endDate));
  const days = q.days;
  const dates = space ? space.slots : expandRange(startDate, endDate);
  const store = await getStore();
  const now = Date.now();
  // Firestore rejects undefined values, so drop empty optionals.
  const customer = JSON.parse(
    JSON.stringify({ ...args.customer, company: args.customer.company || undefined, notes: args.customer.notes || undefined }),
  ) as Customer;

  for (let attempt = 0; attempt < 5; attempt++) {
    const booking: Booking = {
      reference: generateReference(new Date(now)),
      status: "held",
      items: q.lines,
      startDate,
      endDate,
      days,
      total: q.total,
      customer,
      ...(details ? { details } : {}),
      ...(space ?? {}),
      ...(service ? { holds: lines, service: service.details } : {}),
      createdAt: now,
      expiresAt: now + business.holdHours * 3_600_000,
    };

    try {
      await store.commitEnquiry(lines, dates, booking);
    } catch (err) {
      if (err instanceof DuplicateReferenceError) continue;
      if (err instanceof ConflictError) {
        const byResource = new Map<string, string[]>();
        for (const c of err.conflicts) byResource.set(c.resourceId, [...(byResource.get(c.resourceId) ?? []), c.date]);
        return {
          ok: false,
          error: space
            ? "Someone has just booked part of that time. Please pick another slot."
            : "Someone has just booked some of this. Please pick different dates.",
          conflicts: [...byResource].map(([id, ds]) => ({ name: resources.get(id)?.name ?? id, dates: ds })),
        };
      }
      console.error("[submitBooking] commit failed", err);
      return { ok: false, error: "We couldn't submit your enquiry. Please try again." };
    }

    // The booking stands even if email delivery fails; Zstudio can still see it.
    await sendEnquiryEmails(booking).catch((e) => console.error("[submitBooking] email failed", e));
    return { ok: true, reference: booking.reference, ...(isDemoMode() && { demo: encodeDemoSummary(booking) }) };
  }
  return { ok: false, error: "We couldn't generate a reference. Please try again." };
}
