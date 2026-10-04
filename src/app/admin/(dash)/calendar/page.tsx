import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { displayStatus } from "@/lib/admin/data";
import { addDays, expandRange, isIsoDate, todaySA } from "@/lib/booking/dates";
import { getStore } from "@/lib/booking/store";
import type { Booking, ResourceKind } from "@/lib/booking/types";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const kinds: { key: ResourceKind | "all"; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "equipment", label: "Equipment" },
  { key: "studio", label: "Studio" },
  { key: "workshop", label: "Workshops" },
];

const monthLabel = (m: string) =>
  new Intl.DateTimeFormat("en-ZA", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${m}-01T00:00:00Z`));

function shiftMonth(m: string, delta: number) {
  const d = new Date(`${m}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

/** Monday-start grid covering the whole month. */
function gridFor(month: string) {
  const first = `${month}-01`;
  const last = addDays(`${shiftMonth(month, 1)}-01`, -1);
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
  const trail = 6 - ((new Date(`${last}T00:00:00Z`).getUTCDay() + 6) % 7);
  return expandRange(addDays(first, -lead), addDays(last, trail));
}

const label = (b: Booking) =>
  b.items.length === 1 ? `${b.items[0].qty > 1 ? `${b.items[0].qty}× ` : ""}${b.items[0].name}` : `${b.items.length} items`;

export default async function AdminCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; kind?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const today = todaySA();
  const month = sp.month && isIsoDate(`${sp.month}-01`) ? sp.month : today.slice(0, 7);
  const kind = kinds.some((k) => k.key === sp.kind) ? (sp.kind as ResourceKind | "all") : "all";

  const days = gridFor(month);
  const now = Date.now();
  // Only bookings that actually block stock: confirmed, or held and not yet expired.
  const bookings = (await (await getStore()).listBookingsOverlapping(days[0], days[days.length - 1]))
    .filter((b) => ["confirmed", "awaiting"].includes(displayStatus(b, now)))
    .filter((b) => kind === "all" || b.items.some((i) => i.kind === kind))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.reference.localeCompare(b.reference));

  const byDay = new Map<string, Booking[]>();
  for (const b of bookings) {
    for (const d of expandRange(b.startDate < days[0] ? days[0] : b.startDate, b.endDate > days[days.length - 1] ? days[days.length - 1] : b.endDate)) {
      byDay.set(d, [...(byDay.get(d) ?? []), b]);
    }
  }

  const link = (q: Record<string, string>) => ({ query: { month, ...(kind !== "all" && { kind }), ...q } });

  return (
    <div className="max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-4xl">{monthLabel(month)}</h1>
          <div className="flex">
            <Link href={link({ month: shiftMonth(month, -1) })} className="press p-2 text-rose" aria-label="Previous month">
              <ChevronLeft size={20} />
            </Link>
            <Link href={link({ month: shiftMonth(month, 1) })} className="press p-2 text-rose" aria-label="Next month">
              <ChevronRight size={20} />
            </Link>
          </div>
          {month !== today.slice(0, 7) && (
            <Link href={link({ month: today.slice(0, 7) })} className="link-underline text-sm text-muted">
              Today
            </Link>
          )}
        </div>
        <nav className="flex flex-wrap gap-1" aria-label="Show">
          {kinds.map((k) => (
            <Link
              key={k.key}
              href={{ query: { month, ...(k.key !== "all" && { kind: k.key }) } }}
              aria-current={kind === k.key ? "page" : undefined}
              className={cn("rounded-[2px] px-3 py-1.5 text-sm", kind === k.key ? "bg-raised text-bone" : "text-muted hover:text-bone")}
            >
              {k.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[1px] bg-emerald-400/70" /> Confirmed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[1px] border border-rose bg-rose/20" /> Awaiting payment
        </span>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-7 gap-px overflow-hidden border border-line bg-line">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-surface px-2 py-2 text-[11px] tracking-[0.14em] text-muted uppercase">
              {d}
            </div>
          ))}
          {days.map((d) => {
            const inMonth = d.startsWith(month);
            const list = byDay.get(d) ?? [];
            return (
              <div key={d} className={cn("min-h-28 bg-ink p-1.5", !inMonth && "bg-ink/60")}>
                <p
                  className={cn(
                    "mb-1 px-1 text-xs tabular-nums",
                    d === today ? "font-semibold text-rose" : inMonth ? "text-bone" : "text-muted/50",
                  )}
                >
                  {Number(d.slice(8))}
                </p>
                <ul className="space-y-1">
                  {list.slice(0, 4).map((b) => {
                    const confirmed = b.status === "confirmed";
                    return (
                      <li key={b.reference}>
                        <Link
                          href={`/admin/bookings/${b.reference}`}
                          title={`${b.reference} · ${b.customer.fullName} · ${b.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}`}
                          className={cn(
                            "block truncate rounded-[2px] px-1.5 py-0.5 text-[11px] leading-tight",
                            confirmed ? "bg-emerald-400/15 text-emerald-200" : "border border-rose/50 bg-rose/10 text-rose",
                          )}
                        >
                          {label(b)}
                          <span className="opacity-70"> · {b.customer.fullName.split(" ")[0]}</span>
                        </Link>
                      </li>
                    );
                  })}
                  {list.length > 4 && <li className="px-1.5 text-[11px] text-muted">+{list.length - 4} more</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
