"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createServiceBooking, getServiceUnavailableTimes } from "../actions";
import { DayStep, DetailsFields, SummaryAside, TimeStep, useTakenTimes } from "./parts";
import { QtyStepper } from "@/components/QtyStepper";
import { formatDisplayDate } from "@/lib/booking/dates";
import { customerSchema, MAX_SERVICE_PEOPLE, type CustomerInput } from "@/lib/booking/schema";
import { formatDuration, formatTimeRange } from "@/lib/booking/slots";
import type { ServicePackage } from "@/lib/booking/types";
import { formatRand } from "@/lib/money";
import { cn } from "@/lib/cn";

interface Service {
  id: string;
  name: string;
  packages: ServicePackage[];
  rooms: { id: string; name: string }[];
}

export function ServiceBooking({ service }: { service: Service }) {
  const router = useRouter();
  const [pkgId, setPkgId] = useState(service.packages[0].id);
  const [people, setPeople] = useState(1);
  const [roomId, setRoomId] = useState(service.rooms[0]?.id ?? null);
  const [date, setDate] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [pending, startTransition] = useTransition();

  const pkg = service.packages.find((p) => p.id === pkgId) ?? service.packages[0];
  const headcount = pkg.perPerson ? people : 1;
  const slots = pkg.slots * headcount;
  const total = pkg.price * headcount;
  const indoor = pkg.location === "studio";
  const room = indoor ? service.rooms.find((r) => r.id === roomId) : undefined;
  const step = service.packages.length > 1 || pkg.perPerson || (indoor && service.rooms.length > 1) ? 1 : 0;

  // The team (and the room, indoors) must be free for the whole package.
  const { taken, freeFrom, refresh } = useTakenTimes(date, `${pkg.location}:${room?.id ?? ""}`, (d) =>
    getServiceUnavailableTimes(service.id, pkg.location, room?.id ?? null, d),
  );
  useEffect(() => {
    if (start && taken && (freeFrom.get(start) ?? 0) < slots) setStart(null);
  }, [start, taken, freeFrom, slots]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CustomerInput>({ resolver: zodResolver(customerSchema), mode: "onTouched" });

  const onSubmit = (customer: CustomerInput) => {
    if (!date || !start) return;
    startTransition(async () => {
      const res = await createServiceBooking({
        serviceId: service.id,
        packageId: pkg.id,
        ...(room && { roomId: room.id }),
        people: headcount,
        date,
        startTime: start,
        customer,
        acceptTerms: accepted,
        website,
      });
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
        {step === 1 && (
          <section>
            <p className="eyebrow">1 · Choose your package</p>
            {service.packages.length > 1 && (
              <div className="mt-5 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Package">
                {service.packages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={p.id === pkg.id}
                    onClick={() => setPkgId(p.id)}
                    className={cn(
                      "press flex items-baseline justify-between gap-4 border p-4 text-left",
                      p.id === pkg.id ? "border-rose bg-rose/10" : "border-line",
                    )}
                  >
                    <span>
                      <span className="block text-[15px]">{p.label}</span>
                      <span className="text-xs text-muted">{p.location === "studio" ? "In the studio" : "On location"}</span>
                    </span>
                    <span className="font-display text-xl text-rose tabular-nums">{formatRand(p.price)}</span>
                  </button>
                ))}
              </div>
            )}

            {pkg.perPerson && (
              <div className="mt-5 flex items-center justify-between gap-4 border border-line p-4">
                <span className="text-sm">
                  People
                  <span className="block text-xs text-muted">
                    {formatDuration(pkg.slots)} each. {MAX_SERVICE_PEOPLE + 1}+? Message us for a group rate.
                  </span>
                </span>
                <QtyStepper value={people} max={MAX_SERVICE_PEOPLE} onChange={setPeople} label="Number of people" />
              </div>
            )}

            {indoor && service.rooms.length > 1 && (
              <div className="mt-5">
                <p className="text-sm">Which room?</p>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Room">
                  {service.rooms.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      role="radio"
                      aria-checked={r.id === room?.id}
                      onClick={() => setRoomId(r.id)}
                      className={cn("press h-10 border px-4 text-sm", r.id === room?.id ? "border-rose bg-rose/10 text-rose" : "border-line")}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <DayStep
          step={step + 1}
          date={date}
          onChange={(d) => {
            setDate(d);
            setStart(null);
          }}
        />
        <TimeStep
          step={step + 2}
          date={date}
          taken={taken}
          freeFrom={freeFrom}
          needed={slots}
          start={start}
          onChange={setStart}
          note={`Showing starts with ${formatDuration(slots)} free${room ? ` in the ${room.name}` : ""}.`}
        />

        <form id="service-booking" onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-xl">
          <DetailsFields
            step={step + 3}
            register={register}
            errors={errors}
            website={website}
            onWebsite={setWebsite}
            accepted={accepted}
            onAccepted={setAccepted}
            notesPlaceholder={indoor ? "What you're shooting, references, how many people…" : "Location, what you're shooting, references…"}
          />
        </form>
      </div>

      <SummaryAside
        title={`${service.name} · ${pkg.label}`}
        lines={
          date && start
            ? [
                formatDisplayDate(date),
                `${formatTimeRange(start, slots)} · ${formatDuration(slots)}`,
                room ? room.name : "On location",
                ...(pkg.perPerson ? [`${headcount} ${headcount === 1 ? "person" : "people"}`] : []),
              ]
            : null
        }
        placeholder={date ? "Pick a start time." : "Pick a day and a time."}
        total={total}
        formId="service-booking"
        disabled={!date || !start || !accepted}
        pending={pending}
        cta="Book the shoot"
      />
    </div>
  );
}
