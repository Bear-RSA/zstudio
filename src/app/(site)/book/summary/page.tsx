"use client";

import Link from "next/link";
import { useCartGuard } from "../useCartGuard";
import { formatDisplayDate } from "@/lib/booking/dates";
import { billableDays, nextBusinessDay } from "@/lib/booking/holidays";
import { useCart } from "@/stores/cart";
import { formatRand } from "@/lib/money";
import { Media } from "@/components/Media";

export default function SummaryPage() {
  const { ready } = useCartGuard({ needDates: true });
  const items = useCart((s) => s.items);
  const startDate = useCart((s) => s.startDate);
  const endDate = useCart((s) => s.endDate);

  if (!ready || !startDate || !endDate) return <div className="h-96" />;

  const days = billableDays(startDate, endDate);
  const total = items.reduce((s, i) => s + i.dailyRate * i.qty * days, 0);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-tight">Your hire</h1>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2 border-y border-line py-4">
        <p className="text-[15px]">
          {formatDisplayDate(startDate)}
          {endDate !== startDate && <> → {formatDisplayDate(endDate)}</>}
          <span className="block text-sm text-muted">Return by {formatDisplayDate(nextBusinessDay(endDate))}</span>
        </p>
        <p className="text-sm text-muted">
          {days} {days === 1 ? "day" : "days"} ·{" "}
          <Link href="/book/dates" className="link-underline text-rose">
            Change
          </Link>
        </p>
      </div>

      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.resourceId} className="flex gap-4 py-5">
            <Media src={item.image} alt={item.name} sizes="64px" className="h-16 w-16 shrink-0 rounded-lg" label=" " />
            <div className="min-w-0 flex-1">
              <p className="eyebrow">{item.category}</p>
              <p className="truncate text-[15px]">{item.name}</p>
              <p className="mt-1 text-sm text-muted tabular-nums">
                {item.qty} × {formatRand(item.dailyRate)} × {days} {days === 1 ? "day" : "days"}
              </p>
            </div>
            <p className="shrink-0 text-[15px] tabular-nums">{formatRand(item.dailyRate * item.qty * days)}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between border-t border-line-strong pt-5">
        <span className="eyebrow">Total</span>
        <span className="font-display text-4xl tabular-nums">{formatRand(total)}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        No payment is taken now. After you enquire, you&rsquo;ll get a reference number and our banking details to pay
        by EFT. We hold your dates for 48 hours.
      </p>

      <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link href="/book/dates" className="btn-ghost">
          Back
        </Link>
        <Link href="/book/details" className="btn-primary">
          Continue to details
        </Link>
      </div>
    </div>
  );
}
