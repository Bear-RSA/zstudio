import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Media } from "@/components/Media";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Reveal } from "@/components/Reveal";
import { INSTAGRAM_URL, projects } from "@/content/community";
import { listUpcomingWorkshops } from "@/lib/booking/catalog";
import { formatDayMonth, formatWeekday } from "@/lib/booking/dates";
import { formatRand } from "@/lib/money";

export const metadata: Metadata = {
  title: "Community",
  description: "Work made at Z Studios, our collaborators, and upcoming workshops in Cape Town.",
};
export const revalidate = 60;

export default async function CommunityPage() {
  const workshops = await listUpcomingWorkshops();

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-16">
      <p className="eyebrow">Community</p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(40px,6vw,80px)] leading-[0.98]">
        Made here, <em className="text-rose italic">with you.</em>
      </h1>
      <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
        The shoots, sessions and collaborations that have come through the studio, and the workshops where we share
        what we&rsquo;ve learned.
      </p>

      {/* Upcoming workshops */}
      <section className="mt-20" aria-labelledby="workshops">
        <div className="flex items-end justify-between gap-4">
          <h2 id="workshops" className="font-display text-4xl">
            Upcoming workshops
          </h2>
        </div>
        {workshops.length ? (
          <ul className="mt-8 grid gap-px overflow-hidden border border-line bg-line">
            {workshops.map((w) => (
              <li key={w.id} className="bg-ink">
                <Link
                  href={`/community/workshops/${w.slug}`}
                  className="group grid gap-4 p-6 sm:grid-cols-[140px_1fr_auto] sm:items-center sm:gap-8 sm:p-8"
                >
                  <div>
                    <p className="font-display text-3xl leading-none tabular-nums">{formatDayMonth(w.date)}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatWeekday(w.date)}
                      {w.startTime && ` · ${w.startTime}–${w.endTime}`}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg">{w.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{w.description}</p>
                  </div>
                  <div className="flex items-center justify-between gap-6 sm:flex-col sm:items-end sm:gap-1">
                    <p className="font-display text-2xl tabular-nums">{formatRand(w.dailyRate)}</p>
                    <p className={w.seatsLeft ? "text-xs text-muted" : "text-xs text-danger"}>
                      {w.seatsLeft === 0 ? "Fully booked" : `${w.seatsLeft} ${w.seatsLeft === 1 ? "seat" : "seats"} left`}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 border border-line p-8">
            <p className="text-[15px]">No workshops scheduled right now.</p>
            <p className="mt-1 text-sm text-muted">Join the newsletter below and you&rsquo;ll hear about the next one first.</p>
          </div>
        )}
      </section>

      {/* Work & collaborations */}
      <section className="mt-24" aria-labelledby="work">
        <h2 id="work" className="font-display text-4xl">
          Work &amp; collaborations
        </h2>
        {projects.length ? (
          <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const card = (
                <>
                  <Reveal>
                    <Media src={p.image} alt={p.title} sizes="(min-width: 1024px) 33vw, 50vw" className="aspect-[4/5]" imgClassName="card-img" />
                  </Reveal>
                  <p className="eyebrow mt-4">
                    {p.type} · {p.year}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-lg">
                    {p.title}
                    {p.href && <ArrowUpRight size={16} className="text-muted" />}
                  </p>
                  {p.collaborator && <p className="mt-1 text-sm text-muted">with {p.collaborator}</p>}
                </>
              );
              return (
                <li key={`${p.title}-${p.year}`} className="card-hover">
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noreferrer" className="block">
                      {card}
                    </a>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="press mt-8 flex items-center justify-between gap-6 border border-line p-8"
          >
            <div>
              <p className="text-[15px]">See the latest work from the studio on Instagram.</p>
              <p className="mt-1 text-sm text-muted">@_thezstudios</p>
            </div>
            <ArrowUpRight className="shrink-0 text-rose" />
          </a>
        )}
      </section>

      {/* Newsletter */}
      <section className="mt-24 grid gap-8 border-t border-line pt-14 lg:grid-cols-2" aria-labelledby="newsletter-heading">
        <div>
          <h2 id="newsletter-heading" className="font-display text-4xl">
            The newsletter
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            First word on workshops, open studio days and new kit. Occasional, never spammy.
          </p>
        </div>
        <NewsletterForm className="lg:pt-2" />
      </section>
    </div>
  );
}
