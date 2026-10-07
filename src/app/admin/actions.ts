"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { resourceInputSchema } from "@/lib/admin/schema";
import { formatDisplayDate } from "@/lib/booking/dates";
import { BookingStateError, ConflictError, getStore, SlugTakenError } from "@/lib/booking/store";
import type { Resource } from "@/lib/booking/types";
import { sendBookingConfirmedEmail } from "@/lib/email/send";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const REF = /^ZS-\d{6}-[2-9A-HJKMNP-TV-Z]{4}$/;

function refreshAfterBookingChange(reference: string) {
  revalidatePath("/admin", "layout");
  // Public seat counts and availability read the same holds.
  revalidatePath("/community", "layout");
  revalidatePath(`/book/confirmation/${reference}`);
}

export async function confirmBookingAction(reference: string, notifyCustomer: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!REF.test(reference)) return { ok: false, error: "Invalid reference." };

  try {
    const store = await getStore();
    const booking = await store.confirmBooking(reference, admin.email, Date.now());
    refreshAfterBookingChange(reference);
    if (!notifyCustomer) return { ok: true, message: `${reference} confirmed.` };
    try {
      await sendBookingConfirmedEmail(booking);
      return { ok: true, message: `${reference} confirmed — customer emailed.` };
    } catch (e) {
      console.error("[admin] confirmation email failed", e);
      return { ok: true, message: `${reference} confirmed, but the email to the customer failed.` };
    }
  } catch (e) {
    if (e instanceof BookingStateError) return { ok: false, error: e.message };
    if (e instanceof ConflictError) {
      const days = [...new Set(e.conflicts.map((c) => formatDisplayDate(c.date)))].join(", ");
      return {
        ok: false,
        error: `This hold expired and the stock has since been booked by someone else (${days}). Contact the customer or release it.`,
      };
    }
    console.error("[admin] confirm failed", e);
    return { ok: false, error: "Couldn't confirm the booking. Please try again." };
  }
}

export async function releaseBookingAction(reference: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!REF.test(reference)) return { ok: false, error: "Invalid reference." };
  try {
    await (await getStore()).releaseBooking(reference, admin.email, Date.now());
    refreshAfterBookingChange(reference);
    return { ok: true, message: `${reference} released — its dates are free again.` };
  } catch (e) {
    if (e instanceof BookingStateError) return { ok: false, error: e.message };
    console.error("[admin] release failed", e);
    return { ok: false, error: "Couldn't release the booking. Please try again." };
  }
}

export async function saveResourceAction(input: unknown): Promise<ActionResult & { id?: string }> {
  await requireAdmin();
  const parsed = resourceInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { id: existingId, ...data } = parsed.data;
  const store = await getStore();

  // New items get their slug as a permanent id; existing ids never change (bookings reference them).
  let id = existingId;
  if (!id) {
    const taken = new Set((await store.listAllResources()).map((r) => r.id));
    id = data.slug;
    for (let n = 2; taken.has(id); n++) id = `${data.slug}-${n}`;
  } else if (!(await store.listAllResources()).some((r) => r.id === existingId)) {
    return { ok: false, error: "That item no longer exists." };
  }

  const resource: Resource = {
    ...data,
    id,
    stock: data.kind === "studio" ? 1 : data.stock,
    // Workshop-only fields are dropped for gear and spaces; the minimum booking only applies to spaces.
    ...(data.kind === "workshop" ? {} : { date: undefined, startTime: undefined, endTime: undefined, host: undefined }),
    ...(data.kind === "studio" ? {} : { minSlots: undefined }),
    ...(data.kind === "service" ? {} : { packages: undefined, rooms: undefined }),
  };

  try {
    await store.saveResource(resource);
  } catch (e) {
    if (e instanceof SlugTakenError) return { ok: false, error: "Another item already uses that URL slug.", fieldErrors: { slug: ["Already in use"] } };
    console.error("[admin] save resource failed", e);
    return { ok: false, error: "Couldn't save. Please try again." };
  }
  revalidatePath("/", "layout"); // catalog pages are ISR-cached
  return { ok: true, id, message: `${resource.name} saved.` };
}
