"use server";

import { z } from "zod";
import { findConflicts } from "@/lib/booking/availability";
import { addDays, dayCount, expandRange, todaySA } from "@/lib/booking/dates";
import { cartLineSchema, enquirySchema, MAX_RANGE_DAYS, MAX_WRITES } from "@/lib/booking/schema";
import { getStore } from "@/lib/booking/store";
import { normalise, submitBooking, type SubmitResult } from "@/lib/booking/submit";
import type { CartLine } from "@/lib/booking/types";

const WINDOW_DAYS = 120;

/**
 * Dates in [from, from + WINDOW_DAYS) on which at least one cart line can't be
 * satisfied. Feeds the calendar's `disabled` prop.
 */
export async function getUnavailableDates(rawLines: CartLine[], from: string): Promise<string[]> {
  const lines = normalise(z.array(cartLineSchema).max(30).parse(rawLines));
  if (!lines.length) return [];
  const start = from < todaySA() ? todaySA() : from;
  const dates = expandRange(start, addDays(start, WINDOW_DAYS - 1));

  const store = await getStore();
  const resources = await store.getResources(lines.map((l) => l.resourceId));
  const stock = Object.fromEntries(lines.map((l) => [l.resourceId, resources.get(l.resourceId)?.stock ?? 0]));
  const docs = await store.queryBlockedDates(
    lines.map((l) => l.resourceId),
    dates[0],
    dates[dates.length - 1],
  );

  const blocked = new Set(findConflicts(lines, dates, stock, docs, Date.now()).map((c) => c.date));
  return [...blocked].sort();
}

export type EnquiryResult = SubmitResult;

export async function createEnquiry(input: unknown): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const { startDate, endDate, customer } = parsed.data;
  const lines = normalise(parsed.data.lines);

  if (startDate < todaySA()) return { ok: false, error: "The start date has already passed." };
  if (endDate < startDate) return { ok: false, error: "The return date is before the collection date." };
  const days = dayCount(startDate, endDate);
  if (days > MAX_RANGE_DAYS) return { ok: false, error: `Bookings can be at most ${MAX_RANGE_DAYS} days.` };
  if (days * lines.length > MAX_WRITES) return { ok: false, error: "That booking is too large — please call us." };

  const store = await getStore();
  const resources = await store.getResources(lines.map((l) => l.resourceId));
  // Workshops have fixed dates and their own sign-up flow; they can't ride along in the cart.
  if (resources.size !== lines.length || [...resources.values()].some((r) => r.kind === "workshop")) {
    return { ok: false, error: "An item in your cart is no longer available." };
  }

  return submitBooking({ lines, resources, startDate, endDate, customer });
}
