import Link from "next/link";
import { BookingActions } from "./BookingActions";
import { StatusBadge } from "./StatusBadge";
import { displayStatus } from "@/lib/admin/data";
import { formatDayMonth, formatDisplayDate } from "@/lib/booking/dates";
import type { Booking } from "@/lib/booking/types";
import { formatRand } from "@/lib/money";

const dateRange = (b: Booking) =>
  b.startDate === b.endDate ? formatDisplayDate(b.startDate) : `${formatDisplayDate(b.startDate)} → ${formatDisplayDate(b.endDate)}`;

// "12 Oct → 14 Oct": the full dates are on the booking page; the list only needs to be scannable.
const shortRange = (b: Booking) =>
  b.startDate === b.endDate ? formatDayMonth(b.startDate) : `${formatDayMonth(b.startDate)} → ${formatDayMonth(b.endDate)}`;

const summary = (b: Booking) =>
  b.items.length === 1 ? `${b.items[0].qty} × ${b.items[0].name}` : `${b.items.length} items · ${b.items.map((i) => i.name).join(", ")}`;

/**
 * Cards below xl (laptops, tablets, phones), a table from xl up — so the status and
 * actions are never hidden behind a sideways scroll.
 */
export function BookingsTable({ bookings, empty }: { bookings: Booking[]; empty: string }) {
  if (!bookings.length) return <p className="border border-line p-6 text-sm text-muted">{empty}</p>;
  const now = Date.now();
  const rows = bookings.map((b) => ({ b, status: displayStatus(b, now) }));

  return (
    <>
      <ul className="divide-y divide-line border border-line xl:hidden">
        {rows.map(({ b, status }) => (
          <li key={b.reference} className="flex flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <Link
                href={`/admin/bookings/${b.reference}`}
                className="link-underline font-mono text-sm whitespace-nowrap text-rose"
              >
                {b.reference}
              </Link>
              <StatusBadge status={status} />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <p>
                {b.customer.fullName} <span className="text-muted">· {b.customer.phone}</span>
              </p>
              <p className="tabular-nums">{formatRand(b.total)}</p>
            </div>
            <p className="text-sm text-muted">
              {summary(b)} · {dateRange(b)}
            </p>
            <BookingActions reference={b.reference} status={status} compact />
          </li>
        ))}
      </ul>

      <div className="hidden border border-line xl:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              {["Reference", "Customer", "Booking", "Dates", "Total", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] font-normal tracking-[0.14em] uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map(({ b, status }) => (
              <tr key={b.reference} className="align-middle">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link href={`/admin/bookings/${b.reference}`} className="link-underline font-mono text-rose">
                    {b.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="whitespace-nowrap">{b.customer.fullName}</p>
                  <p className="text-xs text-muted">{b.customer.phone}</p>
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-muted" title={summary(b)}>
                  {summary(b)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted" title={dateRange(b)}>
                  {shortRange(b)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatRand(b.total)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3">
                  <BookingActions reference={b.reference} status={status} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
