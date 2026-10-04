import { notFound } from "next/navigation";
import { business } from "@/lib/config";
import { getStore } from "@/lib/booking/store";
import { REFERENCE_PATTERN } from "@/lib/booking/reference";
import { formatDisplayDate } from "@/lib/booking/dates";
import { formatRand } from "@/lib/money";
import { ClearCart, CopyButton } from "./client";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  if (!REFERENCE_PATTERN.test(ref)) notFound();
  const booking = await (await getStore()).getBooking(ref);
  if (!booking) notFound();

  const { bank } = business;
  const expires = new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(booking.expiresAt));

  const rows: [string, string][] = [
    ["Bank", bank.bankName],
    ["Account name", bank.accountName],
    ["Account number", bank.accountNumber],
    ["Branch code", bank.branchCode],
    ["Account type", bank.accountType],
  ];

  const isWorkshop = booking.items.every((i) => i.kind === "workshop");

  // No customer PII here — the reference is all that's in the URL.
  return (
    <div className="mx-auto max-w-2xl">
      {/* A workshop sign-up never touched the gear cart, so leave it alone. */}
      {!isWorkshop && <ClearCart />}
      <p className="eyebrow text-rose!">{isWorkshop ? "Seat reserved" : "Enquiry received"}</p>
      <h1 className="mt-3 font-display text-[clamp(36px,6vw,60px)] leading-[1.05]">
        {isWorkshop ? "See you there." : <>You&rsquo;re pencilled in.</>}
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        We&rsquo;ve emailed you a copy. Pay by EFT using your reference below, then send proof of payment and
        we&rsquo;ll confirm your booking. Your {isWorkshop ? "seat is" : "dates are"} held until <span className="text-bone">{expires}</span>.
      </p>

      <div className="mt-10 border border-rose p-6 sm:p-8">
        <p className="eyebrow">Your payment reference</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[clamp(26px,6vw,36px)] tracking-[0.06em] text-rose">{booking.reference}</p>
          <CopyButton value={booking.reference} />
        </div>
        <div className="mt-6 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">Amount due</span>
          <span className="font-display text-3xl tabular-nums">{formatRand(booking.total)}</span>
        </div>
      </div>

      <section className="mt-10">
        <p className="eyebrow">Banking details</p>
        <dl className="mt-4 border-t border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-line py-3 text-[15px]">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-b border-line py-3 text-[15px]">
            <dt className="text-muted">Reference</dt>
            <dd className="font-mono text-rose">{booking.reference}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <p className="eyebrow">Proof of payment</p>
        <p className="mt-3 text-[15px] leading-relaxed">
          Email it to{" "}
          <a
            href={`mailto:${business.proofOfPaymentEmail}?subject=${encodeURIComponent(`Proof of payment ${booking.reference}`)}`}
            className="link-underline text-rose"
          >
            {business.proofOfPaymentEmail}
          </a>{" "}
          with your reference in the subject line.
        </p>
      </section>

      <section className="mt-10 border-t border-line pt-6">
        <p className="eyebrow">Booking</p>
        <p className="mt-3 text-[15px]">
          {formatDisplayDate(booking.startDate)}
          {booking.endDate !== booking.startDate && <> → {formatDisplayDate(booking.endDate)}</>}
          {!isWorkshop && ` · ${booking.days} ${booking.days === 1 ? "day" : "days"}`}
        </p>
        {booking.details && <p className="mt-1 text-sm text-muted">{booking.details}</p>}
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {booking.items.map((i) => (
            <li key={i.resourceId} className="flex justify-between gap-4">
              <span>
                {i.qty} × {i.name}
              </span>
              <span className="tabular-nums">{formatRand(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
