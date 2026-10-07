"use client";

// The pieces shared by space and service bookings: day, start time, details, summary.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { toast } from "sonner";
import { addDays, formatDisplayDate, fromLocalDate, todaySA, toLocalDate } from "@/lib/booking/dates";
import type { CustomerInput } from "@/lib/booking/schema";
import { dayStartTimes, DEPOSIT_RATE, isOpenDay, slotsUntilClose } from "@/lib/booking/slots";
import { formatRand } from "@/lib/money";
import { cn } from "@/lib/cn";

const WINDOW_DAYS = 120;
export const times = dayStartTimes();

/**
 * Taken start times for a day, refetched whenever `key` changes, plus how many consecutive
 * half-hours are free from each start (capped at closing).
 */
export function useTakenTimes(date: string | null, key: string, load: (date: string) => Promise<string[]>) {
  const [taken, setTaken] = useState<Set<string> | null>(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!date) return;
    let live = true;
    setTaken(null);
    load(date)
      .then((t) => live && setTaken(new Set(t)))
      .catch(() => live && toast.error("We couldn't load availability. Please refresh."));
    return () => {
      live = false;
    };
    // `load` is recreated each render; `key` captures what it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, key, reload]);

  const freeFrom = useMemo(() => {
    const out = new Map<string, number>();
    let run = 0;
    for (let i = times.length - 1; i >= 0; i--) {
      run = taken?.has(times[i]) ? 0 : Math.min(run + 1, slotsUntilClose(times[i]));
      out.set(times[i], run);
    }
    return out;
  }, [taken]);

  return { taken, freeFrom, refresh: () => setReload((n) => n + 1) };
}

export function DayStep({ step, date, onChange }: { step: number; date: string | null; onChange: (date: string) => void }) {
  const today = todaySA();
  const lastBookable = addDays(today, WINDOW_DAYS - 1);
  const disabled = useMemo(
    () => [{ before: toLocalDate(today) }, { after: toLocalDate(lastBookable) }, (d: Date) => !isOpenDay(fromLocalDate(d))],
    [today, lastBookable],
  );
  return (
    <section>
      <p className="eyebrow">{step} · Pick a day</p>
      <p className="mt-2 text-sm text-muted">Monday to Saturday, closed on public holidays.</p>
      <div className="mt-5 border border-line bg-surface p-3 sm:p-6">
        <DayPicker
          mode="single"
          className="zs-calendar"
          weekStartsOn={1}
          startMonth={toLocalDate(today)}
          endMonth={toLocalDate(lastBookable)}
          selected={date ? toLocalDate(date) : undefined}
          disabled={disabled}
          onSelect={(d) => d && onChange(fromLocalDate(d))}
        />
      </div>
    </section>
  );
}

/** Start-time buttons: a start is offered only when `needed` half-hours are free from it. */
export function TimeStep({
  step,
  date,
  taken,
  freeFrom,
  needed,
  start,
  onChange,
  note,
}: {
  step: number;
  date: string | null;
  taken: Set<string> | null;
  freeFrom: Map<string, number>;
  needed: number;
  start: string | null;
  onChange: (start: string) => void;
  note?: string;
}) {
  return (
    <section aria-busy={Boolean(date) && !taken}>
      <p className="eyebrow">{step} · Pick a start time</p>
      {date ? (
        <>
          <p className="mt-2 text-sm text-muted">
            {formatDisplayDate(date)}. Struck-through times are booked{note ? `. ${note}` : "."}
          </p>
          <div className={cn("mt-5 grid grid-cols-3 gap-2 transition-opacity duration-150 ease-[ease] sm:grid-cols-6", !taken && "opacity-50")}>
            {times.map((t) => {
              const unavailable = !taken || (freeFrom.get(t) ?? 0) < needed;
              return (
                <button
                  key={t}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={start === t}
                  onClick={() => onChange(t)}
                  className={cn(
                    "press h-11 border text-sm tabular-nums",
                    start === t ? "border-rose bg-rose/10 text-rose" : "border-line",
                    unavailable && "text-muted/50 line-through",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">Pick a day first.</p>
      )}
    </section>
  );
}

const fields: { name: keyof CustomerInput; label: string; type?: string; autoComplete?: string; hint?: string; optional?: boolean }[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
  { name: "idNumber", label: "SA ID or passport number", autoComplete: "off", hint: "Required for studio bookings." },
  { name: "company", label: "Company", autoComplete: "organization", optional: true },
];

/** The customer fields, honeypot and terms. Render inside the booking's <form>. */
export function DetailsFields({
  step,
  register,
  errors,
  website,
  onWebsite,
  accepted,
  onAccepted,
  notesPlaceholder,
}: {
  step: number;
  register: UseFormRegister<CustomerInput>;
  errors: FieldErrors<CustomerInput>;
  website: string;
  onWebsite: (v: string) => void;
  accepted: boolean;
  onAccepted: (v: boolean) => void;
  notesPlaceholder: string;
}) {
  return (
    <>
      <p className="eyebrow">{step} · Your details</p>
      <p className="mt-2 text-sm text-muted">We&rsquo;ll send your reference and banking details to this email.</p>
      <div className="mt-6 grid gap-5">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-2 flex items-baseline justify-between text-sm">
              {f.label}
              {f.optional && <span className="text-xs text-muted">Optional</span>}
            </span>
            <input
              {...register(f.name)}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              aria-invalid={errors[f.name] ? true : undefined}
              className="field"
            />
            {errors[f.name] ? (
              <span className="mt-1.5 block text-xs text-danger" role="alert">
                {errors[f.name]?.message}
              </span>
            ) : (
              f.hint && <span className="mt-1.5 block text-xs text-muted">{f.hint}</span>
            )}
          </label>
        ))}
        <label className="block">
          <span className="mb-2 flex items-baseline justify-between text-sm">
            Anything we should know?
            <span className="text-xs text-muted">Optional</span>
          </span>
          <textarea {...register("notes")} rows={3} className="field resize-y" placeholder={notesPlaceholder} />
        </label>
        {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={website}
          onChange={(e) => onWebsite(e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onAccepted(e.target.checked)}
            className="mt-1 size-4 shrink-0 accent-[var(--color-rose)]"
          />
          <span>
            I accept the{" "}
            <Link href="/terms" target="_blank" className="text-bone underline underline-offset-2">
              terms and conditions
            </Link>{" "}
            and the{" "}
            <Link href="/studio#conditions" target="_blank" className="text-bone underline underline-offset-2">
              booking conditions
            </Link>
            , and understand my time is held for 48 hours and secured once the 50% non-refundable deposit is received.
            My details are handled under the{" "}
            <Link href="/privacy" target="_blank" className="text-bone underline underline-offset-2">
              privacy policy
            </Link>
            .
          </span>
        </label>
      </div>
    </>
  );
}

/** The sticky summary with total, deposit and the submit button (bound to `formId`). */
export function SummaryAside({
  title,
  lines,
  placeholder,
  total,
  formId,
  disabled,
  pending,
  cta,
}: {
  title: string;
  lines: string[] | null;
  placeholder: string;
  total: number;
  formId: string;
  disabled: boolean;
  pending: boolean;
  cta: string;
}) {
  return (
    <aside>
      <div className="border border-line p-6 lg:sticky lg:top-28">
        <p className="eyebrow">Your booking</p>
        <p className="mt-3 font-display text-2xl">{title}</p>
        {lines ? (
          <>
            <p className="mt-2 text-[15px]">{lines[0]}</p>
            {lines.slice(1).map((l) => (
              <p key={l} className="text-sm text-muted tabular-nums">
                {l}
              </p>
            ))}
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">{placeholder}</p>
        )}
        <div className="mt-6 space-y-2 border-t border-line pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted">Total</span>
            <span className="font-display text-2xl tabular-nums">{formatRand(total)}</span>
          </div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted">Deposit due ({DEPOSIT_RATE * 100}%)</span>
            <span className="tabular-nums">{formatRand(Math.round(total * DEPOSIT_RATE))}</span>
          </div>
        </div>
        <button type="submit" form={formId} className="btn-primary relative mt-6 w-full" disabled={disabled || pending}>
          <span className="morph" data-hidden={pending}>
            {cta}
          </span>
          <span className="morph absolute inset-0 flex items-center justify-center" data-hidden={!pending} aria-hidden={!pending}>
            Booking…
          </span>
        </button>
        <p className="mt-3 text-center text-xs text-muted">No payment now — you&rsquo;ll get banking details and a reference.</p>
      </div>
    </aside>
  );
}
