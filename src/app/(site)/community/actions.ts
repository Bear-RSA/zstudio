"use server";

import { Resend } from "resend";
import { todaySA } from "@/lib/booking/dates";
import { newsletterSchema, workshopSignupSchema } from "@/lib/booking/schema";
import { getStore } from "@/lib/booking/store";
import { submitBooking, type SubmitResult } from "@/lib/booking/submit";
import { isDemoMode } from "@/lib/demo";

export async function createWorkshopSignup(input: unknown): Promise<SubmitResult> {
  const parsed = workshopSignupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const { workshopId, seats, attendee } = parsed.data;

  const resources = await (await getStore()).getResources([workshopId]);
  const workshop = resources.get(workshopId);
  if (!workshop || workshop.kind !== "workshop" || !workshop.date) {
    return { ok: false, error: "This workshop is no longer available." };
  }
  if (workshop.date < todaySA()) return { ok: false, error: "This workshop has already taken place." };

  const result = await submitBooking({
    lines: [{ resourceId: workshopId, qty: seats }],
    resources,
    startDate: workshop.date,
    endDate: workshop.date,
    customer: attendee,
    details: [workshop.startTime && `${workshop.startTime}–${workshop.endTime ?? ""}`, workshop.host && `hosted by ${workshop.host}`]
      .filter(Boolean)
      .join(" · "),
  });
  if (!result.ok && result.conflicts) {
    return { ok: false, error: "Not enough seats left for that many people — try fewer, or join the newsletter for the next one." };
  }
  return result;
}

export type NewsletterResult = { ok: true } | { ok: false; error: string };

/**
 * Adds the address to Resend so Zstudio can send newsletters from the Resend dashboard.
 * RESEND_NEWSLETTER_SEGMENT_ID (optional) puts subscribers in a dedicated segment.
 */
export async function subscribeNewsletter(input: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please enter a valid email" };
  // Bots fill the honeypot; tell them it worked and do nothing.
  if (parsed.data.website) return { ok: true };

  const key = process.env.RESEND_API_KEY;
  if (!key || isDemoMode()) {
    console.warn(`[newsletter] RESEND_API_KEY not set — would subscribe ${parsed.data.email}`);
    return { ok: true };
  }
  const segment = process.env.RESEND_NEWSLETTER_SEGMENT_ID;
  const { error } = await new Resend(key).contacts.create({
    email: parsed.data.email,
    unsubscribed: false,
    ...(segment ? { segments: [{ id: segment }] } : {}),
  });
  // Re-subscribing an existing contact isn't an error from the visitor's point of view.
  if (error && !/already exists/i.test(error.message)) {
    console.error("[newsletter] subscribe failed", error);
    return { ok: false, error: "We couldn't sign you up just now. Please try again." };
  }
  return { ok: true };
}
