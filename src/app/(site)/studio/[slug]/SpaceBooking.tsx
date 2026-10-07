"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { createSpaceBooking, getUnavailableTimes } from "../actions";
import { DayStep, DetailsFields, SummaryAside, TimeStep, times, useTakenTimes } from "./parts";
import { formatDisplayDate } from "@/lib/booking/dates";
import { customerSchema, type CustomerInput } from "@/lib/booking/schema";
import { formatDuration, formatTimeRange, slotsUntilClose } from "@/lib/booking/slots";

interface Space {
  id: string;
  name: string;
  /** Per 30 minutes. */
  rate: number;
  minSlots: number;
}

export function SpaceBooking({ space }: { space: Space }) {
  const router = useRouter();
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [slots, setSlots] = useState(Math.max(space.minSlots, 2));
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [pending, startTransition] = useTransition();
  const { taken, freeFrom, refresh } = useTakenTimes(date, space.id, (d) => getUnavailableTimes(space.id, d));

  const maxSlots = start ? (freeFrom.get(start) ?? 0) : 0;
  // A start that no longer fits (someone booked, or the date changed) is cleared.
  useEffect(() => {
    if (start && taken && maxSlots < space.minSlots) setStart(null);
  }, [start, taken, maxSlots, space.minSlots]);
  const duration = start ? Math.min(Math.max(slots, space.minSlots), maxSlots) : slots;
  const total = duration * space.rate;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CustomerInput>({ resolver: zodResolver(customerSchema), mode: "onTouched" });

  const onSubmit = (customer: CustomerInput) => {
    if (!date || !start) return;
    startTransition(async () => {
      const res = await createSpaceBooking({ resourceId: space.id, date, startTime: start, slots: duration, customer, acceptTerms: accepted, website });
      if (res.ok) {
        router.push(`/book/confirmation/${res.reference}${res.demo ? `?d=${res.demo}` : ""}`);
        return;
      }
      if (res.fieldErrors) {
        for (const [field, msgs] of Object.entries(res.fieldErrors)) {
          if (field in customerSchema.shape) setError(field as keyof CustomerInput, { message: msgs[0] });
        }
      }
      toast.error(res.error);
      refresh();
    });
  };

  return (
    <div className="mt-16 grid gap-10 border-t border-line pt-12 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-12">
        <DayStep
          step={1}
          date={date}
          onChange={(d) => {
            setDate(d);
            setStart(null);
          }}
        />
        <TimeStep
          step={2}
          date={date}
          taken={taken}
          freeFrom={freeFrom}
          needed={space.minSlots}
          start={start}
          onChange={setStart}
          note={space.minSlots > 1 ? `Minimum booking ${formatDuration(space.minSlots)}.` : undefined}
        />

        <section>
          <p className="eyebrow">3 · How long?</p>
          <div className="mt-5 flex items-center gap-4">
            <div className="inline-flex h-11 items-center border border-line" role="group" aria-label="Duration">
              <button
                type="button"
                className="press flex h-full w-11 items-center justify-center text-muted disabled:opacity-30"
                onClick={() => setSlots(duration - 1)}
                disabled={duration <= space.minSlots}
                aria-label="Shorter"
              >
                <Minus size={14} />
              </button>
              <span className="w-28 text-center text-sm tabular-nums" aria-live="polite">
                {formatDuration(duration)}
              </span>
              <button
                type="button"
                className="press flex h-full w-11 items-center justify-center text-muted disabled:opacity-30"
                onClick={() => setSlots(duration + 1)}
                disabled={start ? duration >= maxSlots : duration >= slotsUntilClose(times[0])}
                aria-label="Longer"
              >
                <Plus size={14} />
              </button>
            </div>
            {start && <span className="text-sm text-muted tabular-nums">{formatTimeRange(start, duration)}</span>}
          </div>
        </section>

        <form id="space-booking" onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl">
          <DetailsFields
            step={4}
            register={register}
            errors={errors}
            website={website}
            onWebsite={setWebsite}
            accepted={accepted}
            onAccepted={setAccepted}
            notesPlaceholder="What you're making, crew size…"
          />
        </form>
      </div>

      <SummaryAside
        title={space.name}
        lines={date && start ? [formatDisplayDate(date), `${formatTimeRange(start, duration)} · ${formatDuration(duration)}`] : null}
        placeholder={date ? "Pick a start time." : "Pick a day and a time."}
        total={total}
        formId="space-booking"
        disabled={!date || !start || !accepted}
        pending={pending}
        cta={`Book ${formatDuration(duration)}`}
      />
    </div>
  );
}
