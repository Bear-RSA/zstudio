import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Media } from "@/components/Media";
import { Reveal } from "@/components/Reveal";
import { contact } from "@/content/contact";
import { bookingConditions, studioKit } from "@/content/studio";
import { listServices, listSpaces } from "@/lib/booking/catalog";
import { spaceRates } from "@/lib/booking/pricing";
import { formatRand } from "@/lib/money";

export const metadata: Metadata = {
  title: "Studio hire",
  description:
    "Book a podcast studio, white infinity studio, green screen studio or boardroom in Woodstock, Cape Town, by the half hour.",
};
export const revalidate = 300;

export default async function StudioPage() {
  const [spaces, services] = await Promise.all([listSpaces(), listServices()]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-16">
        <p className="eyebrow">Studio hire · By the half hour</p>
        <h1 className="mt-3 font-display text-[clamp(44px,7vw,96px)] leading-[0.95]">
          The <em className="text-rose italic">Studio</em>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
          Four spaces in Woodstock for podcasts, shoots, video and meetings. Pick a space, then a day and a time:
          bookings run in 30-minute slots, {contact.hours}.
        </p>

        <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2">
          {spaces.map((s) => (
            <li key={s.id}>
              <Link href={`/studio/${s.slug}`} className="card-hover group block">
                <Reveal>
                  <Media
                    src={s.images[0]}
                    alt={s.name}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="aspect-[4/3]"
                    imgClassName="card-img"
                    label="STUDIO"
                  />
                </Reveal>
                <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h2 className="font-display text-3xl">{s.name}</h2>
                  <p className="text-sm tabular-nums">
                    {spaceRates(s).map((r, i) => (
                      <span key={r.unit}>
                        {i > 0 && <span className="text-muted"> · </span>}
                        <span className="text-rose">{formatRand(r.amount)}</span>{" "}
                        <span className="text-muted">{r.unit}</span>
                      </span>
                    ))}
                  </p>
                </div>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{s.description}</p>
                <span className="link-underline mt-4 inline-flex items-center gap-2 text-sm text-rose">
                  Book {s.name} <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-8" aria-labelledby="production">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">Production services</p>
            <h2 id="production" className="mt-3 font-display text-[clamp(32px,4vw,48px)] leading-[1.05]">
              We&rsquo;ll shoot it for you.
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-relaxed text-muted">
            Our team handles the shoot, the edit and the grade. Pick a package, a day and a start time, and the
            crew and the room are yours.
          </p>
        </div>
        <ul className="mt-10 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {services.map((s) => (
            <li key={s.id} className="bg-ink">
              <Link href={`/studio/${s.slug}`} className="group flex h-full flex-col p-6 sm:p-8">
                <p className="font-display text-2xl">{s.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                <dl className="mt-6 space-y-2">
                  {s.packages!.map((p) => (
                    <div key={p.id} className="flex items-baseline justify-between gap-4">
                      <dt className="text-sm text-muted">{p.label}</dt>
                      <dd className="font-display text-2xl text-rose tabular-nums">{formatRand(p.price)}</dd>
                    </div>
                  ))}
                </dl>
                <span className="link-underline mt-auto inline-flex items-center gap-2 pt-6 text-sm text-rose">
                  Book {s.name.toLowerCase()} <ArrowRight size={14} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-8" aria-labelledby="conditions">
        <p className="eyebrow" id="conditions">
          Booking conditions
        </p>
        <ul className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {bookingConditions.map((c) => (
            <li key={c.title} className="bg-ink p-6">
              <p className="font-display text-xl">{c.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-24 grid max-w-7xl gap-10 px-4 sm:px-8 lg:grid-cols-2">
        {/* Client photo (studio6): the green-screen room, with the white cyclorama through the opening. */}
        <Reveal>
          <Media
            src="/studio/cyclorama-green-screen.jpg"
            alt="The green-screen room, with the white cyclorama beyond"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="aspect-[3/2]"
          />
        </Reveal>
        <div>
          <p className="eyebrow">Equipment &amp; production</p>
          <ul className="mt-6 border-t border-line">
            {studioKit.map((k) => (
              <li key={k} className="border-b border-line py-3 text-[15px]">
                {k}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Need more? Hire cameras, lenses and lights from the{" "}
            <Link href="/equipment" className="link-underline text-rose">
              kit room
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
