import "server-only";
import { Resend } from "resend";
import { EnquiryEmail } from "@/emails/EnquiryEmail";
import { business } from "@/lib/config";
import { formatRand } from "@/lib/money";
import type { Booking } from "@/lib/booking/types";

export async function sendEnquiryEmails(booking: Booking): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set — skipping emails for ${booking.reference}`);
    return;
  }
  const resend = new Resend(key);
  const shared = {
    booking,
    bank: business.bank,
    proofOfPaymentEmail: business.proofOfPaymentEmail,
    holdHours: business.holdHours,
  };

  const results = await Promise.allSettled([
    resend.emails.send({
      from: business.emailFrom,
      to: business.bookingsInbox,
      replyTo: booking.customer.email,
      subject: `Enquiry ${booking.reference} — ${booking.customer.fullName} — ${formatRand(booking.total)}`,
      react: EnquiryEmail({ ...shared, audience: "internal" }),
    }),
    resend.emails.send({
      from: business.emailFrom,
      to: booking.customer.email,
      replyTo: business.proofOfPaymentEmail,
      subject: `Your Z Studios enquiry ${booking.reference}`,
      react: EnquiryEmail({ ...shared, audience: "customer" }),
    }),
  ]);

  // The internal email is the one that matters; surface its failure.
  const internal = results[0];
  if (internal.status === "rejected") throw internal.reason;
  if (internal.value.error) throw new Error(internal.value.error.message);
  const customer = results[1];
  if (customer.status === "rejected" || customer.value.error) {
    console.error("[email] customer acknowledgement failed", customer);
  }
}
