"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { confirmBookingAction, releaseBookingAction, type ActionResult } from "@/app/admin/actions";
import type { DisplayStatus } from "@/lib/admin/data";
import { cn } from "@/lib/cn";

interface Props {
  reference: string;
  status: DisplayStatus;
  /** Compact = inline in a table row. */
  compact?: boolean;
}

export function BookingActions({ reference, status, compact }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notify, setNotify] = useState(true);
  // Release frees the dates for anyone to book, so it takes a second click to arm.
  const [armed, setArmed] = useState(false);
  const disarm = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(disarm.current), []);

  if (status === "released") return compact ? null : <p className="text-sm text-muted">No actions — this booking was released.</p>;

  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const res = await action();
      if (res.ok) toast.success(res.message ?? "Done");
      else toast.error(res.error, { duration: 8000 });
      setArmed(false);
      router.refresh();
    });

  const canConfirm = status === "awaiting" || status === "expired";
  const btn = compact ? "h-8 px-3 text-[11px]" : "h-10 px-4 text-[12px]";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "justify-end")}>
      {canConfirm && (
        <>
          {!compact && (
            <label className="mr-2 flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
                className="size-4 accent-[var(--color-rose)]"
              />
              Email the customer
            </label>
          )}
          <button
            type="button"
            disabled={pending}
            className={cn("btn-primary", btn)}
            onClick={() => run(() => confirmBookingAction(reference, notify))}
          >
            {pending ? "Working…" : "Confirm payment"}
          </button>
        </>
      )}
      <button
        type="button"
        disabled={pending}
        className={cn("btn-ghost", btn, armed && "border-danger text-danger")}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            clearTimeout(disarm.current);
            disarm.current = setTimeout(() => setArmed(false), 4000);
            return;
          }
          run(() => releaseBookingAction(reference));
        }}
      >
        {armed ? "Click again to release" : status === "confirmed" ? "Cancel booking" : "Release"}
      </button>
    </div>
  );
}
