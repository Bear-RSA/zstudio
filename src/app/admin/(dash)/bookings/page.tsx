import type { Metadata } from "next";
import Link from "next/link";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { requireAdmin } from "@/lib/admin/auth";
import { displayStatus, type DisplayStatus } from "@/lib/admin/data";
import { getStore } from "@/lib/booking/store";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

const tabs: { key: DisplayStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "awaiting", label: "Awaiting payment" },
  { key: "confirmed", label: "Confirmed" },
  { key: "expired", label: "Hold expired" },
  { key: "released", label: "Released" },
];

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await requireAdmin();
  const { status = "all", q = "" } = await searchParams;
  const now = Date.now();
  const all = await (await getStore()).listBookings(500);

  const query = q.trim().toLowerCase();
  const counts = Object.fromEntries(
    tabs.map((t) => [t.key, t.key === "all" ? all.length : all.filter((b) => displayStatus(b, now) === t.key).length]),
  );
  const shown = all
    .filter((b) => status === "all" || displayStatus(b, now) === status)
    .filter(
      (b) =>
        !query ||
        b.reference.toLowerCase().includes(query) ||
        b.customer.fullName.toLowerCase().includes(query) ||
        b.customer.email.toLowerCase().includes(query),
    );

  return (
    <div className="max-w-6xl">
      <h1 className="font-display text-4xl">Bookings</h1>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <nav className="-mx-1 flex gap-1 overflow-x-auto" aria-label="Filter by status">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={{ query: { ...(t.key !== "all" && { status: t.key }), ...(q && { q }) } }}
              aria-current={status === t.key ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-[2px] px-3 py-1.5 text-sm",
                status === t.key ? "bg-raised text-bone" : "text-muted hover:text-bone",
              )}
            >
              {t.label} <span className="text-xs text-muted tabular-nums">{counts[t.key]}</span>
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" role="search">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Reference, name or email"
            aria-label="Search bookings"
            className="field h-10 py-0 lg:w-72"
          />
        </form>
      </div>

      <div className="mt-6">
        <BookingsTable bookings={shown} empty={query ? "No bookings match that search." : "No bookings here yet."} />
      </div>
    </div>
  );
}
