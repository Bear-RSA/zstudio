import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getInventory, type InventoryRow } from "@/lib/admin/data";
import { formatDisplayDate } from "@/lib/booking/dates";
import type { ResourceKind } from "@/lib/booking/types";
import { cn } from "@/lib/cn";
import { formatRand } from "@/lib/money";
import { CLOSE, OPEN } from "@/lib/booking/slots";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

const groups: { kind: ResourceKind; title: string; unit: string; columns: string[] }[] = [
  { kind: "equipment", title: "Equipment", unit: "/day", columns: ["Item", "Rate", "Stock", "Out today", "Held today", "Available"] },
  { kind: "studio", title: "Studio spaces", unit: "/30 min", columns: ["Space", "Rate", "Min. booking", "Paid today", "Held today", "Free today"] },
  { kind: "service", title: "Production services", unit: "", columns: ["Service", "Packages", "Crews", "Paid today", "Held today", "Free today"] },
  { kind: "workshop", title: "Workshops", unit: "/seat", columns: ["Workshop", "Price", "Seats", "Paid seats", "Held seats", "Seats left"] },
];

/** Half-hours as hours: 7 → "3½h", 1 → "½h". */
const hours = (slots: number) => `${Math.floor(slots / 2) || (slots % 2 ? "" : 0)}${slots % 2 ? "½" : ""}h`;

function Row({ r, unit, names }: { r: InventoryRow; unit: string; names: Map<string, string> }) {
  const { resource: res } = r;
  const isWorkshop = res.kind === "workshop";
  const isService = res.kind === "service";
  const count = (n: number) => (r.timed ? hours(n) : n);
  return (
    <tr className={cn(!res.active && "text-muted")}>
      <td className="px-4 py-3">
        <Link href={`/admin/inventory/${res.id}`} className="link-underline">
          {res.name}
        </Link>
        {!res.active && <span className="ml-2 text-[11px] tracking-wide uppercase">· hidden</span>}
        <p className="text-xs text-muted">
          {isWorkshop && res.date
            ? formatDisplayDate(res.date)
            : isService && res.rooms?.length
              ? `Uses ${res.rooms.map((id) => names.get(id) ?? id).join(", ")}`
              : res.category}
        </p>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {isService ? (
          res.packages?.length ? (
            <ul className="space-y-0.5 text-xs">
              {res.packages.map((p) => (
                <li key={p.id}>
                  {p.label} <span className="text-muted">·</span> {formatRand(p.price)}
                  {p.location === "outdoor" && <span className="text-muted"> · outdoor</span>}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-xs text-muted">Held by every shoot</span>
          )
        ) : (
          <>
            {formatRand(res.dailyRate)}
            <span className="text-muted">{unit}</span>
          </>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {res.kind === "studio" ? hours(res.minSlots ?? 1) : isService && res.packages?.length ? <span className="text-muted">—</span> : res.stock}
      </td>
      {isService && !r.timed ? (
        <td colSpan={3} className="px-4 py-3 text-right text-xs text-muted">
          Counted on the production team
        </td>
      ) : (
        <>
          <td className="px-4 py-3 text-right tabular-nums">{r.confirmedToday ? count(r.confirmedToday) : <span className="text-muted">{count(0)}</span>}</td>
          <td className="px-4 py-3 text-right tabular-nums">
            {r.heldToday ? <span className="text-rose">{count(r.heldToday)}</span> : <span className="text-muted">{count(0)}</span>}
          </td>
          <td className="px-4 py-3 text-right tabular-nums">
            {r.availableToday === 0 && res.active ? <span className="text-danger">{count(0)}</span> : count(r.availableToday)}
          </td>
        </>
      )}
    </tr>
  );
}

export default async function AdminInventoryPage() {
  await requireAdmin();
  const rows = await getInventory();
  const names = new Map(rows.map((r) => [r.resource.id, r.resource.name]));

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Inventory</h1>
          <p className="mt-1 text-sm text-muted">
            Gear is counted in units for today, studio spaces and the production team in hours ({OPEN}–{CLOSE}),
            workshops for their own date. <span className="text-rose">Held</span> = awaiting payment.
          </p>
        </div>
        <Link href="/admin/inventory/new" className="btn-primary h-10 px-4 text-[12px]">
          <Plus size={14} /> Add item
        </Link>
      </div>

      {groups.map((g) => {
        const list = rows.filter((r) => r.resource.kind === g.kind);
        return (
          <section key={g.kind} className="mt-10">
            <h2 className="eyebrow">{g.title}</h2>
            {list.length ? (
              <div className="mt-3 overflow-x-auto border border-line">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-line text-muted">
                    <tr>
                      {g.columns.map((h, i) => (
                        <th key={h} className={cn("px-4 py-3 text-[11px] font-normal tracking-[0.14em] uppercase", i ? "text-right" : "text-left")}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {list.map((r) => (
                      <Row key={r.resource.id} r={r} unit={g.unit} names={names} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 border border-line p-5 text-sm text-muted">None yet.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
