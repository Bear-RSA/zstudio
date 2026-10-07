"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { DayButton, DayPicker, type DateRange, type DayButtonProps } from "react-day-picker";
import "react-day-picker/style.css";
import { getUnavailableDates } from "../actions";
import { useCartGuard } from "../useCartGuard";
import { addDays, dayCount, formatDisplayDate, fromLocalDate, todaySA, toLocalDate } from "@/lib/booking/dates";
import { billableDays, isBusinessDay, nextBusinessDay, publicHoliday } from "@/lib/booking/holidays";
import { useCart } from "@/stores/cart";
import { formatRand } from "@/lib/money";
import { cn } from "@/lib/cn";

const MAX_DAYS = 31;
const WINDOW_DAYS = 120;
const TWO_MONTH_WIDTH = 2 * 7 * 44 + 40;

/** Names the public holiday (or says we're closed) when hovering a greyed-out day. */
function TitledDayButton(props: DayButtonProps) {
  const holiday = publicHoliday(fromLocalDate(props.day.date));
  return <DayButton {...props} title={holiday ?? (props.modifiers.closed ? "Closed on weekends" : undefined)} />;
}

export default function DatesPage() {
  const router = useRouter();
  const { ready } = useCartGuard({ needDates: false });
  const items = useCart((s) => s.items);
  const startDate = useCart((s) => s.startDate);
  const endDate = useCart((s) => s.endDate);
  const setDates = useCart((s) => s.setDates);

  const [unavailable, setUnavailable] = useState<Set<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [months, setMonths] = useState(1);
  const [awaitingEnd, setAwaitingEnd] = useState(false);

  // Show two months only when two genuinely fit side by side in the panel
  // (2 × 7 × 44px days + gap); otherwise the second month wraps underneath.
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!panel) return;
    const ro = new ResizeObserver(([entry]) => setMonths(entry.contentRect.width >= TWO_MONTH_WIDTH ? 2 : 1));
    ro.observe(panel);
    return () => ro.disconnect();
  }, [panel]);

  // Key availability on what's in the cart, not on object identity.
  const linesKey = items.map((i) => `${i.resourceId}:${i.qty}`).join(",");
  useEffect(() => {
    if (!ready) return;
    const lines = items.map((i) => ({ resourceId: i.resourceId, qty: i.qty }));
    setError(null);
    startTransition(async () => {
      try {
        const dates = await getUnavailableDates(lines, todaySA());
        setUnavailable(new Set(dates));
      } catch {
        setError("We couldn't load availability. Please refresh.");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, ready]);

  const today = todaySA();
  const lastBookable = addDays(today, WINDOW_DAYS - 1);

  // If stored dates now overlap a blocked day (cart changed, someone else booked), clear them.
  useEffect(() => {
    if (!unavailable || !startDate || !endDate) return;
    let clash = startDate < today;
    for (let d = startDate; !clash && d <= endDate; d = addDays(d, 1)) clash = unavailable.has(d);
    if (clash) setDates(null, null);
  }, [unavailable, startDate, endDate, today, setDates]);

  const selected: DateRange | undefined = startDate
    ? { from: toLocalDate(startDate), to: endDate ? toLocalDate(endDate) : undefined }
    : undefined;

  const disabled = useMemo(
    () => [
      { before: toLocalDate(today) },
      { after: toLocalDate(lastBookable) },
      // Gear is collected and returned on business days only.
      (d: Date) => !isBusinessDay(fromLocalDate(d)),
      (d: Date) => unavailable?.has(fromLocalDate(d)) ?? true,
    ],
    [today, lastBookable, unavailable],
  );

  const spansBlocked = (from: string, to: string) => {
    for (let d = from; d <= to; d = addDays(d, 1)) if (unavailable?.has(d)) return true;
    return false;
  };

  // Weekends and public holidays inside the range are free; the span still caps the length.
  const days = startDate && endDate ? billableDays(startDate, endDate) : 0;
  const returnDate = endDate ? nextBusinessDay(endDate) : null;
  const perDay = items.reduce((s, i) => s + i.dailyRate * i.qty, 0);
  const tooLong = startDate && endDate ? dayCount(startDate, endDate) > MAX_DAYS : false;

  if (!ready) return <div className="h-96" />;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-tight">
          When do you need it?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Tap your first day, then your last day. Gear comes back the next business day, and weekends and
          public holidays aren&rsquo;t charged. Struck-through days are already booked.
        </p>

        <div
          ref={setPanel}
          className={cn(
            "mt-8 border border-line bg-surface p-3 transition-opacity duration-150 ease-[ease] sm:p-6",
            !unavailable && "opacity-50",
          )}
          aria-busy={!unavailable}
        >
          <DayPicker
            mode="range"
            className="zs-calendar"
            numberOfMonths={months}
            pagedNavigation
            weekStartsOn={1}
            startMonth={toLocalDate(today)}
            endMonth={toLocalDate(lastBookable)}
            defaultMonth={selected?.from ?? toLocalDate(today)}
            selected={selected}
            disabled={disabled}
            modifiers={{
              closed: (d) => !isBusinessDay(fromLocalDate(d)),
              booked: (d) => isBusinessDay(fromLocalDate(d)) && (unavailable?.has(fromLocalDate(d)) ?? false),
            }}
            modifiersClassNames={{ closed: "zs-closed", booked: "zs-booked" }}
            components={{ DayButton: TitledDayButton }}
            onSelect={(_, trigger) => {
              // First tap = collection day (a one-day booking on its own); second tap = return day;
              // a tap after that starts over. Tapping before the start, or across a booked day,
              // also starts over rather than producing a range we'd have to reject.
              const day = fromLocalDate(trigger);
              if (awaitingEnd && startDate && day >= startDate && !spansBlocked(startDate, day)) {
                setDates(startDate, day);
                setAwaitingEnd(false);
              } else {
                setDates(day, day);
                setAwaitingEnd(true);
              }
            }}
          />
        </div>
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </div>

      <aside className="lg:pt-20">
        <div className="border border-line p-6 lg:sticky lg:top-28">
          <p className="eyebrow">Your dates</p>
          {startDate && endDate ? (
            <>
              <p className="mt-3 text-[15px]">{formatDisplayDate(startDate)}</p>
              {endDate !== startDate && <p className="text-[15px]">→ {formatDisplayDate(endDate)}</p>}
              <p className="mt-1 text-sm text-muted">
                {days} {days === 1 ? "day" : "days"} charged
              </p>
              {returnDate && <p className="mt-1 text-sm text-muted">Return by {formatDisplayDate(returnDate)}</p>}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No dates selected yet.</p>
          )}
          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-4">
            <span className="text-sm text-muted">Estimated total</span>
            <span className="font-display text-2xl tabular-nums">{formatRand(perDay * Math.max(days, 1))}</span>
          </div>
          {tooLong && <p className="mt-3 text-sm text-danger">Bookings can be at most {MAX_DAYS} days.</p>}
          <button
            type="button"
            className="btn-primary mt-6 w-full"
            disabled={!startDate || !endDate || tooLong}
            onClick={() => router.push("/book/summary")}
          >
            Continue
          </button>
          <Link href="/equipment" className="link-underline mt-4 block text-center text-sm text-muted">
            Add more equipment
          </Link>
        </div>
      </aside>
    </div>
  );
}
