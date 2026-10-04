import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listUpcomingWorkshops } from "@/lib/booking/catalog";
import { formatDisplayDate } from "@/lib/booking/dates";
import { MAX_WORKSHOP_SEATS } from "@/lib/booking/schema";
import { formatRand } from "@/lib/money";
import { WorkshopSignupForm } from "./WorkshopSignupForm";

export const dynamic = "force-dynamic"; // seat counts must be live

type Props = { params: Promise<{ slug: string }> };

async function find(slug: string) {
  return (await listUpcomingWorkshops()).find((w) => w.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const w = await find((await params).slug);
  return w ? { title: w.name, description: w.description } : {};
}

export default async function WorkshopPage({ params }: Props) {
  const w = await find((await params).slug);
  if (!w) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-8 sm:pt-12">
      <Link href="/community" className="link-underline inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft size={14} /> Community
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div>
          <p className="eyebrow">Workshop</p>
          <h1 className="mt-3 font-display text-[clamp(36px,5vw,60px)] leading-[1.02]">{w.name}</h1>
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
            {[
              ["Date", formatDisplayDate(w.date)],
              ["Time", w.startTime ? `${w.startTime}–${w.endTime}` : "TBC"],
              ["Price", `${formatRand(w.dailyRate)} / seat`],
              ["Seats left", w.seatsLeft ? `${w.seatsLeft} of ${w.stock}` : "Fully booked"],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink p-4">
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1 text-[15px] tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-muted">{w.description}</p>
          {w.specs.length > 0 && (
            <ul className="mt-8 max-w-2xl border-t border-line">
              {w.specs.map((s) => (
                <li key={s} className="border-b border-line py-3 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          )}
          {w.host && <p className="mt-6 text-sm text-muted">Hosted by {w.host}, at Z Studios, Cape Town.</p>}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          {w.seatsLeft > 0 ? (
            <WorkshopSignupForm
              workshopId={w.id}
              price={w.dailyRate}
              maxSeats={Math.min(w.seatsLeft, MAX_WORKSHOP_SEATS)}
            />
          ) : (
            <div className="border border-line p-6">
              <p className="text-[15px]">This workshop is fully booked.</p>
              <Link href="/community#newsletter-heading" className="link-underline mt-2 inline-block text-sm text-rose">
                Join the newsletter to hear about the next one
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
