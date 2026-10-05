"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createWorkshopSignup } from "@/app/(site)/community/actions";
import { QtyStepper } from "@/components/QtyStepper";
import { workshopAttendeeSchema, type WorkshopAttendeeInput } from "@/lib/booking/schema";
import { formatRand } from "@/lib/money";

const fields: { name: keyof WorkshopAttendeeInput; label: string; type?: string; autoComplete: string }[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel" },
];

export function WorkshopSignupForm({ workshopId, price, maxSeats }: { workshopId: string; price: number; maxSeats: number }) {
  const router = useRouter();
  const [seats, setSeats] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkshopAttendeeInput>({ resolver: zodResolver(workshopAttendeeSchema), mode: "onTouched" });

  const onSubmit = (attendee: WorkshopAttendeeInput) =>
    startTransition(async () => {
      const res = await createWorkshopSignup({ workshopId, seats, attendee, acceptTerms: accepted, website });
      if (res.ok) router.push(`/book/confirmation/${res.reference}${res.demo ? `?d=${res.demo}` : ""}`);
      else {
        toast.error(res.error);
        router.refresh(); // seat count may have changed
      }
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="border border-line p-6">
      <p className="font-display text-2xl">Reserve your seat</p>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm">Seats</span>
        <QtyStepper value={seats} max={maxSeats} onChange={setSeats} label="Number of seats" />
      </div>

      <div className="mt-5 grid gap-4">
        {fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1.5 block text-sm">{f.label}</span>
            <input
              {...register(f.name)}
              type={f.type ?? "text"}
              autoComplete={f.autoComplete}
              aria-invalid={errors[f.name] ? true : undefined}
              className="field"
            />
            {errors[f.name] && (
              <span className="mt-1 block text-xs text-danger" role="alert">
                {errors[f.name]?.message}
              </span>
            )}
          </label>
        ))}
        <label className="block">
          <span className="mb-1.5 block text-sm">
            Anything we should know? <span className="text-xs text-muted">Optional</span>
          </span>
          <textarea {...register("notes")} rows={3} className="field resize-y" placeholder="Experience level, what you'd like to learn…" />
        </label>
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
            <Link href="/terms#workshops" target="_blank" className="text-bone underline underline-offset-2">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="text-bone underline underline-offset-2">
              privacy policy
            </Link>
            , and understand my seat is held for 48 hours and confirmed once my EFT payment is received.
          </span>
        </label>
      </div>

      <div className="mt-6 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">
          {seats} × {formatRand(price)}
        </span>
        <span className="font-display text-3xl tabular-nums">{formatRand(seats * price)}</span>
      </div>
      <button type="submit" disabled={!accepted || pending} className="btn-primary relative mt-5 w-full">
        <span className="morph" data-hidden={pending}>
          Sign up
        </span>
        <span className="morph absolute inset-0 flex items-center justify-center" data-hidden={!pending} aria-hidden={!pending}>
          Reserving…
        </span>
      </button>
      <p className="mt-3 text-center text-xs text-muted">No payment now — you&rsquo;ll get banking details and a reference.</p>
    </form>
  );
}
