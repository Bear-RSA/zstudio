"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createEnquiry } from "../actions";
import { useCartGuard } from "../useCartGuard";
import { customerSchema, type CustomerInput } from "@/lib/booking/schema";
import { formatDisplayDate } from "@/lib/booking/dates";
import { billableDays } from "@/lib/booking/holidays";
import { useCart } from "@/stores/cart";
import { formatRand } from "@/lib/money";
import { cn } from "@/lib/cn";

const fields: {
  name: keyof CustomerInput;
  label: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  optional?: boolean;
  inputMode?: "tel" | "email" | "text";
}[] = [
  { name: "fullName", label: "Full name", autoComplete: "name", hint: "The person the booking is legally hired to." },
  { name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", inputMode: "tel" },
  { name: "idNumber", label: "SA ID or passport number", autoComplete: "off", hint: "Required for equipment liability." },
  { name: "company", label: "Company", autoComplete: "organization", optional: true },
];

export default function DetailsPage() {
  const router = useRouter();
  const { ready } = useCartGuard({ needDates: true });
  const items = useCart((s) => s.items);
  const startDate = useCart((s) => s.startDate);
  const endDate = useCart((s) => s.endDate);
  const [pending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CustomerInput>({ resolver: zodResolver(customerSchema), mode: "onTouched" });

  if (!ready || !startDate || !endDate) return <div className="h-96" />;

  const days = billableDays(startDate, endDate);
  const total = items.reduce((s, i) => s + i.dailyRate * i.qty * days, 0);

  const onSubmit = (customer: CustomerInput) => {
    startTransition(async () => {
      const result = await createEnquiry({
        lines: items.map((i) => ({ resourceId: i.resourceId, qty: i.qty })),
        startDate,
        endDate,
        customer,
        acceptTerms: accepted,
        website,
      });

      if (result.ok) {
        // The confirmation page clears the cart; clearing here would trip the cart guard first.
        router.replace(`/book/confirmation/${result.reference}${result.demo ? `?d=${result.demo}` : ""}`);
        return;
      }
      if (result.conflicts?.length) {
        toast.error(result.error, {
          description: result.conflicts.map((c) => `${c.name}: ${c.dates.map(formatDisplayDate).join(", ")}`).join(" · "),
          duration: 8000,
        });
        router.push("/book/dates");
        return;
      }
      if (result.fieldErrors) {
        for (const [field, msgs] of Object.entries(result.fieldErrors)) {
          if (field in customerSchema.shape) setError(field as keyof CustomerInput, { message: msgs[0] });
        }
      }
      toast.error(result.error);
    });
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] leading-tight">Your details</h1>
        <p className="mt-2 text-sm text-muted">We&rsquo;ll send your reference and banking details to this email.</p>

        <div className="mt-8 grid gap-5">
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
                inputMode={f.inputMode}
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
            <textarea {...register("notes")} rows={4} className="field resize-y" placeholder="Shoot type, crew size, collection time…" />
          </label>

          {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-[var(--color-rose)]"
            />
            <span>
              I accept the{" "}
              <Link href="/terms" target="_blank" className="text-bone underline underline-offset-2">
                terms and conditions
              </Link>
              , including responsibility for hired equipment from collection to return, and understand the booking is
              held for 48 hours pending EFT payment. My details are handled under the{" "}
              <Link href="/privacy" target="_blank" className="text-bone underline underline-offset-2">
                privacy policy
              </Link>
              .
            </span>
          </label>
        </div>

        <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Link href="/book/summary" className="btn-ghost">
            Back
          </Link>
          <button type="submit" className="btn-primary relative min-w-48" disabled={!accepted || pending}>
            <span className="morph" data-hidden={pending}>
              Enquiry
            </span>
            <span className="morph absolute inset-0 flex items-center justify-center" data-hidden={!pending} aria-hidden={!pending}>
              Sending…
            </span>
          </button>
        </div>
      </form>

      <aside className="lg:pt-20">
        <div className="border border-line p-6 lg:sticky lg:top-28">
          <p className="eyebrow">Summary</p>
          <p className="mt-3 text-sm">
            {formatDisplayDate(startDate)}
            {endDate !== startDate && <> → {formatDisplayDate(endDate)}</>}
          </p>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {items.map((i) => (
              <li key={i.resourceId} className="flex justify-between gap-3">
                <span className="truncate">
                  {i.qty} × {i.name}
                </span>
              </li>
            ))}
          </ul>
          <div className={cn("mt-5 flex items-baseline justify-between border-t border-line pt-4")}>
            <span className="text-sm text-muted">
              {days} {days === 1 ? "day" : "days"}
            </span>
            <span className="font-display text-2xl tabular-nums">{formatRand(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
