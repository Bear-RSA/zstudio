import Link from "next/link";
import type { ScheduleEntry } from "@/lib/admin/data";
import { CLOSE, OPEN } from "@/lib/booking/slots";
import type { Resource } from "@/lib/booking/types";
import { cn } from "@/lib/cn";

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const dayStart = minutes(OPEN);
const dayLength = minutes(CLOSE) - dayStart;
const pct = (t: string) => `${((minutes(t) - dayStart) / dayLength) * 100}%`;
/** Hour marks along the day: 08:00 … 17:00. */
const marks = Array.from(
  { length: Math.floor(dayLength / 60) + 1 },
  (_, i) => `${String(Math.ceil(dayStart / 60) + i).padStart(2, "0")}:00`,
);

/**
 * One row per studio space and the production team: the day as a bar from opening to closing,
 * each booking a block (green paid, pink awaiting payment), then the bookings listed in order.
 */
export function StudioSchedule({ rows }: { rows: { resource: Resource; entries: ScheduleEntry[] }[] }) {
  if (!rows.length) return <p className="border border-line p-6 text-sm text-muted">No studio spaces set up.</p>;
  return (
    <div className="divide-y divide-line border border-line">
      <div className="hidden gap-4 px-4 pt-3 sm:grid sm:grid-cols-[180px_1fr]">
        <span />
        <div className="relative h-4 text-[10px] text-muted tabular-nums">
          {marks.map((m) => (
            <span key={m} className="absolute -translate-x-1/2" style={{ left: pct(m) }}>
              {m.slice(0, 2)}
            </span>
          ))}
        </div>
      </div>
      {rows.map(({ resource, entries }) => (
        <div key={resource.id} className="grid gap-3 p-4 sm:grid-cols-[180px_1fr] sm:gap-4">
          <div>
            <Link href={`/admin/inventory/${resource.id}`} className="link-underline text-sm">
              {resource.name}
            </Link>
            <p className="text-xs text-muted">{entries.length ? `${entries.length} booking${entries.length === 1 ? "" : "s"}` : "Free all day"}</p>
          </div>
          <div className="min-w-0">
            <div className="relative h-7 overflow-hidden rounded-[2px] bg-surface" aria-hidden>
              {marks.slice(1, -1).map((m) => (
                <span key={m} className="absolute inset-y-0 w-px bg-line" style={{ left: pct(m) }} />
              ))}
              {entries.map((e) => (
                <span
                  key={e.reference}
                  title={`${e.startTime}–${e.endTime} · ${e.what} · ${e.customer}`}
                  className={cn(
                    "absolute inset-y-0.5 rounded-[2px]",
                    e.status === "confirmed" ? "bg-success/70" : "border border-rose bg-rose/25",
                  )}
                  style={{ left: pct(e.startTime), width: `calc(${pct(e.endTime)} - ${pct(e.startTime)})` }}
                />
              ))}
            </div>
            {entries.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {entries.map((e) => (
                  <li key={e.reference} className="flex flex-wrap items-baseline gap-x-3">
                    <span className="tabular-nums">
                      {e.startTime}–{e.endTime}
                    </span>
                    <Link href={`/admin/bookings/${e.reference}`} className="link-underline font-mono text-xs text-rose">
                      {e.reference}
                    </Link>
                    <span className="text-muted">
                      {e.what} · {e.customer}
                    </span>
                    <span className={cn("text-xs", e.status === "confirmed" ? "text-success" : "text-rose")}>
                      {e.status === "confirmed" ? "Paid" : "Awaiting payment"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
