import type { Metadata } from "next";
import Link from "next/link";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { StudioSchedule } from "@/components/admin/StudioSchedule";
import { requireAdmin } from "@/lib/admin/auth";
import { getOverview, getStudioSchedule } from "@/lib/admin/data";
import { addDays, formatDisplayDate, isIsoDate, todaySA } from "@/lib/booking/dates";
import { formatRand } from "@/lib/money";
import { CLOSE, isOpenDay, OPEN } from "@/lib/booking/slots";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

/** Half-hours as hours: 7 → "3½h", 1 → "½h". */
const hours = (slots: number) => `${Math.floor(slots / 2) || (slots % 2 ? "" : 0)}${slots % 2 ? "½" : ""}h`;

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  await requireAdmin();
  const today = todaySA();
  // The schedule can step through days (?day=YYYY-MM-DD); everything else is about today.
  const sp = await searchParams;
  const day = sp.day && isIsoDate(sp.day) ? sp.day : today;
  const [o, schedule] = await Promise.all([getOverview(), day === today ? null : getStudioSchedule(day)]);

  const stats = [
    { label: "Awaiting payment", value: String(o.awaiting.length), sub: o.awaiting.length ? formatRand(o.awaitingTotal) : "All settled" },
    { label: "Gear out today", value: `${o.unitsOutToday} / ${o.unitsTotal}`, sub: "units hired or held" },
    {
      label: "Studio today",
      value: o.studioToday.capacity ? `${hours(o.studioToday.booked + o.studioToday.held)} / ${hours(o.studioToday.capacity)}` : "Closed",
      sub: o.studioToday.held ? `${hours(o.studioToday.held)} awaiting payment` : "room hours booked",
    },
    { label: "Expired holds", value: String(o.expiredCount), sub: o.expiredCount ? "no longer blocking stock" : "None" },
  ];

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-4xl">Overview</h1>
      <p className="mt-1 text-sm text-muted">{formatDisplayDate(todaySA())}</p>

      <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink p-5">
            <dt className="eyebrow">{s.label}</dt>
            <dd className="mt-2 font-display text-3xl tabular-nums">{s.value}</dd>
            <dd className="mt-1 text-xs text-muted">{s.sub}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl">{day === today ? "Today in the studio" : `In the studio · ${formatDisplayDate(day)}`}</h2>
            <Link href={{ query: { day: addDays(day, -1) } }} scroll={false} className="press p-1.5 text-rose" aria-label="Previous day">
              <ChevronLeft size={18} />
            </Link>
            <Link href={{ query: { day: addDays(day, 1) } }} scroll={false} className="press p-1.5 text-rose" aria-label="Next day">
              <ChevronRight size={18} />
            </Link>
            {day !== today && (
              <Link href="/admin" scroll={false} className="link-underline text-sm text-muted">
                Today
              </Link>
            )}
          </div>
          <Link href="/admin/calendar?kind=studio" className="link-underline text-sm text-muted">
            Calendar
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted">
          {isOpenDay(day)
            ? `Every room and the production team, ${OPEN}–${CLOSE}. Green is paid; pink is awaiting payment.`
            : "Closed (Sunday or a public holiday)."}
        </p>
        <div className="mt-4">
          <StudioSchedule rows={schedule ?? o.schedule} />
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl">Awaiting payment</h2>
          <Link href="/admin/bookings?status=awaiting" className="link-underline text-sm text-muted">
            All bookings
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted">Soonest-expiring first. Match EFT references, then confirm.</p>
        <div className="mt-4">
          <BookingsTable bookings={o.awaiting} empty="Nothing waiting — every enquiry is paid or closed." />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Next 7 days</h2>
        <p className="mt-1 text-sm text-muted">Confirmed and pending bookings that start, end or run this week.</p>
        <div className="mt-4">
          <BookingsTable bookings={o.upcoming} empty="Nothing booked for the coming week." />
        </div>
      </section>
    </div>
  );
}
