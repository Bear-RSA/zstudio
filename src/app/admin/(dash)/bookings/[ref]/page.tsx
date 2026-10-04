import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BookingActions } from "@/components/admin/BookingActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdmin } from "@/lib/admin/auth";
import { displayStatus } from "@/lib/admin/data";
import { formatDisplayDate } from "@/lib/booking/dates";
import { REFERENCE_PATTERN } from "@/lib/booking/reference";
import { getStore } from "@/lib/booking/store";
import { formatRand } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ ref: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: (await params).ref };
}

const when = (ms?: number) =>
  ms
    ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" }).format(new Date(ms))
    : "—";

export default async function AdminBookingPage({ params }: Props) {
  await requireAdmin();
  const { ref } = await params;
  if (!REFERENCE_PATTERN.test(ref)) notFound();
  const b = await (await getStore()).getBooking(ref);
  if (!b) notFound();
  const status = displayStatus(b);
  const c = b.customer;

  const facts: [string, string][] = [
    [
      "Dates",
      b.startDate === b.endDate ? formatDisplayDate(b.startDate) : `${formatDisplayDate(b.startDate)} → ${formatDisplayDate(b.endDate)}`,
    ],
    ...(b.details ? ([["Details", b.details]] as [string, string][]) : []),
    ["Days", String(b.days)],
    ["Enquiry received", when(b.createdAt)],
    ["Hold expires", b.status === "held" ? when(b.expiresAt) : "—"],
    ["Confirmed", when(b.confirmedAt)],
    ["Released", when(b.releasedAt)],
    ["Last handled by", b.handledBy ?? "—"],
  ];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/bookings" className="link-underline inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft size={14} /> Bookings
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="font-mono text-3xl text-rose">{b.reference}</h1>
        <StatusBadge status={status} />
      </div>

      <div className="mt-6 border border-line p-5">
        <BookingActions reference={b.reference} status={status} />
        {status === "expired" && (
          <p className="mt-3 text-sm text-muted">
            This hold expired, so its dates were released to other customers. Confirming checks they&rsquo;re still free.
          </p>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="eyebrow">Hirer</h2>
          <div className="mt-3 space-y-2 text-[15px]">
            <p>
              {c.fullName}
              {c.company ? <span className="text-muted"> · {c.company}</span> : null}
            </p>
            <p>
              <a href={`mailto:${c.email}?subject=${encodeURIComponent(b.reference)}`} className="link-underline text-rose">
                {c.email}
              </a>
            </p>
            <p>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="link-underline">
                {c.phone}
              </a>
            </p>
            {c.idNumber && (
              <p className="text-muted">
                ID / passport: <span className="text-bone">{c.idNumber}</span>
              </p>
            )}
            {c.notes && <p className="mt-3 border-l-2 border-line-strong pl-3 text-sm text-muted">{c.notes}</p>}
          </div>
        </section>
        <section>
          <h2 className="eyebrow">Booking</h2>
          <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="eyebrow">Items</h2>
        <table className="mt-3 w-full text-sm">
          <tbody className="divide-y divide-line border-y border-line">
            {b.items.map((i) => (
              <tr key={i.resourceId}>
                <td className="py-2">
                  {i.qty} × {i.name}
                </td>
                <td className="py-2 text-right text-muted tabular-nums">
                  {formatRand(i.dailyRate)} × {i.qty} × {b.days}
                </td>
                <td className="py-2 pl-6 text-right tabular-nums">{formatRand(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-3 text-right text-muted">
                Total
              </td>
              <td className="pt-3 pl-6 text-right font-display text-2xl tabular-nums">{formatRand(b.total)}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
