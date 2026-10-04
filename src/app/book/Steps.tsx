"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const steps = [
  { path: "/book/dates", label: "Dates" },
  { path: "/book/summary", label: "Summary" },
  { path: "/book/details", label: "Details" },
];

export function Steps() {
  const pathname = usePathname();
  const current = steps.findIndex((s) => pathname.startsWith(s.path));
  // Workshop sign-ups land on the confirmation page too, without the cart steps before it.
  if (pathname.startsWith("/book/confirmation")) return null;

  return (
    <ol className="flex items-center gap-2 sm:gap-4" aria-label="Booking progress">
      {steps.map((s, i) => (
        <li key={s.path} className="flex items-center gap-2 sm:gap-4">
          <span
            aria-current={i === current ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase",
              i === current ? "text-rose" : i < current ? "text-bone" : "text-muted/60",
            )}
          >
            <span className="tabular-nums">0{i + 1}</span>
            <span className={cn(i !== current && "hidden sm:inline")}>{s.label}</span>
          </span>
          {i < steps.length - 1 && <span className="h-px w-4 bg-line-strong sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}
