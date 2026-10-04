import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/admin/auth";
import { getInventory, type InventoryRow } from "@/lib/admin/data";
import { formatDisplayDate } from "@/lib/booking/dates";
import type { ResourceKind } from "@/lib/booking/types";
import { cn } from "@/lib/cn";
import { formatRand } from "@/lib/money";

export const metadata: Metadata = { title: "Inventory" };
export const dynamic = "force-dynamic";

const groups: { kind: ResourceKind; title: string; unit: string; columns: string[] }[] = [
  { kind: "equipment", title: "Equipment", unit: "/day", columns: ["Item", "Rate", "Stock", "Out today", "Held today", "Available"] },
  { kind: "studio", title: "Studio", unit: "/day", columns: ["Space", "Rate", "Stock", "Booked today", "Held today", "Available"] },
  { kind: "workshop", title: "Workshops", unit: "/seat", columns: ["Workshop", "Price", "Seats", "Paid seats", "Held seats", "Seats left"] },
];

function Row({ r, unit }: { r: InventoryRow; unit: string }) {
  const { resource: res } = r;
  const isWorkshop = res.kind === "workshop";
  return (
    <tr className={cn(!res.active && "text-muted")}>
      <td className="px-4 py-3">
        <Link href={`/admin/inventory/${res.id}`} className="link-underline">
          {res.name}
        </Link>
        {!res.active && <span className="ml-2 text-[11px] tracking-wide uppercase">· hidden</span>}
        <p className="text-xs text-muted">{isWorkshop && res.date ? formatDisplayDate(res.date) : res.category}</p>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {formatRand(res.dailyRate)}
        <span className="text-muted">{unit}</span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums">{res.stock}</td>
      <td className="px-4 py-3 text-right tabular-nums">{r.confirmedToday || <span className="text-muted">0</span>}</td>
      <td className="px-4 py-3 text-right tabular-nums">{r.heldToday ? <span className="text-rose">{r.heldToday}</span> : <span className="text-muted">0</span>}</td>
      <td className="px-4 py-3 text-right tabular-nums">
        {r.availableToday === 0 && res.active ? <span className="text-danger">0</span> : r.availableToday}
      </td>
    </tr>
  );
}

export default async function AdminInventoryPage() {
  await requireAdmin();
  const rows = await getInventory();

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Inventory</h1>
          <p className="mt-1 text-sm text-muted">
            Gear and studio are counted for today; workshops for their own date. <span className="text-rose">Held</span> = awaiting
            payment.
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
                      <Row key={r.resource.id} r={r} unit={g.unit} />
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
