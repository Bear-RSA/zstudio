import type { DisplayStatus } from "@/lib/admin/data";
import { cn } from "@/lib/cn";

const styles: Record<DisplayStatus, { label: string; className: string }> = {
  awaiting: { label: "Awaiting payment", className: "border-rose/50 text-rose" },
  expired: { label: "Hold expired", className: "border-danger/50 text-danger" },
  confirmed: { label: "Confirmed", className: "border-emerald-400/40 text-emerald-300" },
  released: { label: "Released", className: "border-line-strong text-muted" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const s = styles[status];
  return (
    <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-[2px] border px-2 text-[11px] tracking-wide", s.className)}>
      {s.label}
    </span>
  );
}
