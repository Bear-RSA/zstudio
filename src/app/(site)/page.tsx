import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Media } from "@/components/Media";
import { Reveal } from "@/components/Reveal";
import { contact, services, whatsappUrl } from "@/content/contact";
import { listEquipment, listSpaces } from "@/lib/booking/catalog";
import { spaceRates } from "@/lib/booking/pricing";
import { formatRand } from "@/lib/money";

export const revalidate = 300;

const uses = ["Photoshoots", "Podcasts", "Music videos", "Headshots", "Self-tapes"];

// The client's "Sugar" palette, cycled as accents. Literal class names so Tailwind picks them up.
const sugarDots = ["bg-pink", "bg-mint", "bg-lime", "bg-lavender", "bg-coral"];
const sugarHighlights = [
  "bg-[linear-gradient(transparent_60%,var(--color-pink)_60%)]",
  "bg-[linear-gradient(transparent_60%,var(--color-mint)_60%)]",
  "bg-[linear-gradient(transparent_60%,var(--color-lime)_60%)]",
  "bg-[linear-gradient(transparent_60%,var(--color-lavender)_60%)]",
  "bg-[linear-gradient(transparent_60%,var(--color-coral)_60%)]",
];

const audience = [
  "artists",
  "actors",
  "directors",
  "film producers",
  "theatre makers",
  "photographers",
  "musicians",
  "content creators",
  "brands",
];

export default async function Home() {
  const [spaces, equipment] = await Promise.all([listSpaces(), listEquipment()]);
  const fromHourly = spaces.length ? Math.min(...spaces.map((s) => s.dailyRate * 2)) : 0;
  const categories = [...new Set(equipment.map((e) => e.category))];
  const fromRate = equipment.length ? Math.min(...equipment.map((e) => e.dailyRate)) : 0;

  return (
    <>
      {/* Hero */}
      {/* Full-bleed photo under the (transparent) header. */}
      <section className="relative -mt-[107px] sm:-mt-[81px]">
        {/* Taller than the screen: the photo carries on below the fold and dissolves into the page (see the fade layer). */}
        <div className="relative h-[calc(92dvh+12rem)] min-h-[calc(560px+12rem)] w-full overflow-hidden bg-ink sm:h-[calc(92dvh+18rem)] sm:min-h-[calc(560px+18rem)]">
          {/* The white cyclorama (client photo, studio2), kept light. A page-colour wash on the left keeps the dark headline readable. */}
          <Media
            src="/studio/cyclorama.jpg"
            alt=""
            priority
            // Highest quality: the large white wall shows any banding.
            quality={92}
            className="absolute inset-0 rounded-none"
            imgClassName="object-[70%_50%]"
            label=" "
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/0" />
          {/* Phones: the text spans the full width, over the light rig, so wash it a little more. */}
          <div className="absolute inset-0 bg-ink/50 sm:hidden" />
          {/* A soft pink key light behind the headline ties the photo to the brand. */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_15%_75%,rgba(245,191,209,0.35),transparent_70%)]" />
          {/* The photo dissolves into the page colour on an eased (smoothstep) curve: it only ever lightens, so there is no dark stripe and no visible start or end. */}
          <div className="absolute inset-x-0 bottom-0 h-[26rem] bg-[linear-gradient(to_bottom,rgba(253,249,249,0)_0%,rgba(253,249,249,0.03)_10%,rgba(253,249,249,0.1)_20%,rgba(253,249,249,0.2)_30%,rgba(253,249,249,0.33)_40%,rgba(253,249,249,0.5)_50%,rgba(253,249,249,0.67)_60%,rgba(253,249,249,0.8)_70%,rgba(253,249,249,0.9)_80%,rgba(253,249,249,0.97)_90%,rgba(253,249,249,1)_100%)] sm:h-[34rem]" />
          {/* Bottom padding = the fade height below the fold, so the text sits where it did. */}
          <div className="stagger relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-[16rem] sm:px-8 sm:pb-[24rem]">
            <p className="eyebrow">Woodstock, Cape Town · Creative studio space</p>
            <h1
              style={{ ["--i" as string]: 1 }}
              className="mt-5 max-w-4xl font-display text-[clamp(42px,7vw,96px)] leading-[1] font-normal tracking-[-0.02em] text-bone"
            >
              A space where dreams are <em className="text-rose italic">nurtured.</em>
            </h1>
            <p style={{ ["--i" as string]: 2 }} className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
              Professional spaces, equipment and creative services for photography, video, podcasts, music videos,
              rehearsals and everything in between. Bring the idea; we&rsquo;ll help you make it.
            </p>
            <div style={{ ["--i" as string]: 3 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/studio" className="btn-primary">
                Book now
              </Link>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
              >
                Enquire now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:mt-12 sm:px-8" aria-labelledby="services">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow">What we do</p>
            <h2 id="services" className="mt-3 font-display text-[clamp(32px,4vw,48px)] leading-[1.05]">
              More than a studio.
            </h2>
          </div>
          <div>
            <p className="max-w-md text-[15px] leading-relaxed text-muted">
              A creative space where people create, collaborate, learn and produce: with the rooms, the gear and the
              team to bring the vision to life.
            </p>
            <a
              href={whatsappUrl("Hi Z Studios, I'd like to know more about your services and pricing.")}
              target="_blank"
              rel="noreferrer"
              className="link-underline mt-4 inline-flex items-center gap-2 text-sm text-rose"
            >
              Ask about pricing <ArrowRight size={14} />
            </a>
          </div>
        </div>
        {/* 10 services: 2 columns on tablet, 5 × 2 on desktop, so no row is left half-empty. */}
        <ul className="mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {services.map((s, i) => (
            <li key={s.title} className="bg-ink p-5 sm:p-6">
              <span aria-hidden className={`block size-2.5 rounded-full ${sugarDots[i % sugarDots.length]}`} />
              <p className="mt-4 font-display text-xl leading-snug">{s.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* The spaces */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:mt-32 sm:px-8" aria-labelledby="spaces">
        <p className="eyebrow">The spaces</p>
        <h2 id="spaces" className="mt-3 font-display text-[clamp(32px,4vw,48px)] leading-[1.05]">
          Rooms to make things in.
        </h2>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {spaces.map((s) => {
            const [rate] = spaceRates(s);
            return (
              <li key={s.id}>
                <Link href={`/studio/${s.slug}`} className="card-hover group block">
                  <Reveal>
                    {/* Landscape (3:2) photos cropped into a 4:5 card render ~1.9x the card's width, so size for that. */}
                    <Media
                      src={s.images[0]}
                      alt={s.name}
                      sizes="(min-width: 1024px) 48vw, (min-width: 640px) 94vw, 188vw"
                      className="aspect-[4/5]"
                      imgClassName="card-img"
                    />
                  </Reveal>
                  <p className="mt-5 font-display text-2xl">{s.name}</p>
                  <p className="mt-1 text-sm tabular-nums">
                    <span className="text-rose">{formatRand(rate.amount)}</span> <span className="text-muted">{rate.unit}</span>
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Two doors */}
      <section className="mx-auto mt-24 grid max-w-7xl gap-6 px-4 sm:mt-32 sm:px-8 md:grid-cols-2">
        <Link href="/studio" className="card-hover group block">
          <Reveal>
            <Media
              src="/studio/cyclorama-green-screen.jpg"
              alt="The studio"
              sizes="(min-width: 768px) 94vw, 188vw"
              className="aspect-[4/5]"
              imgClassName="card-img"
            />
          </Reveal>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Studio hire</p>
              <h2 className="mt-2 font-display text-4xl">The Studio</h2>
            </div>
            {fromHourly > 0 && <p className="text-sm text-muted tabular-nums">from {formatRand(fromHourly)} / hour</p>}
          </div>
          <p className="mt-3 text-sm text-muted">{uses.join(" · ")}</p>
        </Link>

        <Link href="/equipment" className="card-hover group block md:mt-24">
          <Reveal>
            <Media
              src={(equipment.find((e) => e.id === "canon-eos-c400") ?? equipment[0])?.images[0]}
              alt="Equipment"
              // Landscape photo in a 4:5 card: it renders ~1.9x the card's width.
              sizes="(min-width: 768px) 94vw, 188vw"
              className="aspect-[4/5]"
              imgClassName="card-img"
              label="EQUIPMENT"
            />
          </Reveal>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Equipment rental</p>
              <h2 className="mt-2 font-display text-4xl">The Kit Room</h2>
            </div>
            {fromRate > 0 && <p className="text-sm text-muted tabular-nums">from {formatRand(fromRate)} / day</p>}
          </div>
          <p className="mt-3 text-sm text-muted">{categories.join(" · ")}</p>
        </Link>
      </section>

      {/* Who it's for */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-8">
        <p className="eyebrow">Who it&rsquo;s for</p>
        <p className="mt-6 max-w-5xl font-display text-[clamp(24px,3.2vw,40px)] leading-[1.25]">
          Made for{" "}
          {audience.map((a, i) => (
            <span key={a}>
              <span className={i % 2 ? "" : `italic ${sugarHighlights[(i / 2) % sugarHighlights.length]}`}>{a}</span>
              {i < audience.length - 2 ? ", " : i === audience.length - 2 ? " and " : ""}
            </span>
          ))}{" "}
          — and anyone with an idea worth making.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-8">
        <p className="eyebrow">How hire works</p>
        <ol className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
          {[
            ["Choose", "Add gear, the studio, or both to your hire."],
            ["Pick dates", "The calendar only shows days that are free."],
            ["Enquire", "Send your details. We hold it for 48 hours."],
            ["Pay by EFT", "Use your reference. Send proof of payment — done."],
          ].map(([title, body], i) => (
            <li key={title} className="bg-ink p-6 sm:p-8">
              <span
                className={`flex size-8 items-center justify-center rounded-full font-display text-sm tabular-nums ${sugarDots[i + 1]}`}
              >
                {i + 1}
              </span>
              <p className="mt-6 font-display text-2xl">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <Link href="/equipment" className="link-underline mt-8 inline-flex items-center gap-2 text-sm text-muted">
          Start with equipment <ArrowRight size={14} />
        </Link>
      </section>

      {/* Visit */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-8">
        <div className="grid gap-10 rounded-[var(--radius)] bg-blush/70 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">Visit the studio</p>
            <h2 className="mt-3 font-display text-[clamp(32px,4vw,48px)] leading-[1.05]">
              Come and see the <em className="text-rose italic">space.</em>
            </h2>
            <address className="mt-6 text-[15px] leading-relaxed text-muted not-italic">
              {contact.address[0]}, {contact.address[1]}
              <br />
              {contact.hours}
            </address>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="btn-primary">
              Contact us
            </a>
            <a href={contact.mapsUrl} target="_blank" rel="noreferrer" className="btn-ghost">
              Get directions
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
