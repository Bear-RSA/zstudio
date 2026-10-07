import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Media } from "@/components/Media";
import { getBySlug, listSpaces } from "@/lib/booking/catalog";
import { spaceRates } from "@/lib/booking/pricing";
import type { Resource } from "@/lib/booking/types";
import { formatRand } from "@/lib/money";
import { ServiceBooking } from "./ServiceBooking";
import { SpaceBooking } from "./SpaceBooking";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

/** A studio space, or a production service with packages (the production team itself isn't bookable). */
const bookable = (r: Resource | null): r is Resource => r?.kind === "studio" || (r?.kind === "service" && Boolean(r.packages?.length));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getBySlug((await params).slug);
  return bookable(r) ? { title: r.kind === "studio" ? `${r.name} hire` : r.name, description: r.description } : {};
}

export default async function StudioBookingPage({ params }: Props) {
  const r = await getBySlug((await params).slug);
  if (!bookable(r)) notFound();
  const isService = r.kind === "service";

  const prices = isService
    ? r.packages!.map((p) => ({ unit: p.label, amount: p.price }))
    : spaceRates(r).map((x) => ({ unit: x.unit.replace(/^for /, "").replace(/^per /, "Per "), amount: x.amount }));
  // Rooms an indoor package can use, in the studio's own order.
  const rooms = isService ? (await listSpaces()).filter((s) => r.rooms?.includes(s.id)).map((s) => ({ id: s.id, name: s.name })) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 sm:pt-12">
      <Link href={isService ? "/studio#production" : "/studio"} className="link-underline inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft size={14} /> {isService ? "All services" : "All spaces"}
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
        <Media src={r.images[0]} alt={r.name} priority sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-[3/2]" label="STUDIO" />
        <div>
          <p className="eyebrow">{isService ? "Production services" : "Studio hire"}</p>
          <h1 className="mt-3 font-display text-[clamp(40px,6vw,72px)] leading-[1]">{r.name}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{r.description}</p>
          <dl className="mt-6 border-t border-line">
            {prices.map((p) => (
              <div key={p.unit} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                <dt className="text-sm text-muted">{p.unit}</dt>
                <dd className="font-display text-2xl text-rose tabular-nums">{formatRand(p.amount)}</dd>
              </div>
            ))}
          </dl>
          {r.specs.length > 0 && <p className="mt-4 text-sm text-muted">{r.specs.join(" · ")}</p>}
        </div>
      </div>

      {isService ? (
        <ServiceBooking service={{ id: r.id, name: r.name, packages: r.packages!, rooms }} />
      ) : (
        <SpaceBooking space={{ id: r.id, name: r.name, rate: r.dailyRate, minSlots: r.minSlots ?? 1 }} />
      )}
    </div>
  );
}
