import Link from "next/link";
import { BookingActions } from "./BookingActions";
import { StatusBadge } from "./StatusBadge";
import { displayStatus } from "@/lib/admin/data";
import { formatDisplayDate } from "@/lib/booking/dates";
import type { Booking } from "@/lib/booking/types";
import { formatRand } from "@/lib/money";

const dateRange = (b: Booking) =>
  b.startDate === b.endDate ? formatDisplayDate(b.startDate) : `${formatDisplayDate(b.startDate)} → ${formatDisplayDate(b.endDate)}`;

const summary = (b: Booking) =>
  b.items.length === 1 ? `${b.items[0].qty} × ${b.items[0].name}` : `${b.items.length} items · ${b.items.map((i) => i.name).join(", ")}`;

export function BookingsTable({ bookings, empty }: { bookings: Booking[]; empty: string }) {
  if (!bookings.length) return <p className="border border-line p-6 text-sm text-muted">{empty}</p>;
  const now = Date.now();

  return (
    <div className="overflow-x-auto border border-line">
      <table className="w-full min-w-[820px] text-left text-sm">
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
          {bookings.map((b) => {
            const status = displayStatus(b, now);
            return (
              <tr key={b.reference} className="align-middle">
                <td className="px-4 py-3">
                  <Link href={`/admin/bookings/${b.reference}`} className="link-underline font-mono text-rose">
                    {b.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p>{b.customer.fullName}</p>
                  <p className="text-xs text-muted">{b.customer.phone}</p>
                </td>
                <td className="max-w-[240px] truncate px-4 py-3 text-muted" title={summary(b)}>
                  {summary(b)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{dateRange(b)}</td>
                <td className="px-4 py-3 tabular-nums">{formatRand(b.total)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={status} />
                </td>
                <td className="px-4 py-3">
                  <BookingActions reference={b.reference} status={status} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
