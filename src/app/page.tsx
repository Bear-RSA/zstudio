import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Media } from "@/components/Media";
import { Reveal } from "@/components/Reveal";
import { StudioScene } from "@/components/StudioScene";
import { getStudio, listEquipment } from "@/lib/booking/catalog";
import { formatRand } from "@/lib/money";

export const revalidate = 300;

const uses = ["Photoshoots", "Podcasts", "Music videos", "Headshots"];

export default async function Home() {
  const [studio, equipment] = await Promise.all([getStudio(), listEquipment()]);
  const categories = [...new Set(equipment.map((e) => e.category))];
  const fromRate = equipment.length ? Math.min(...equipment.map((e) => e.dailyRate)) : 0;

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-16 sm:-mt-20">
        <div className="grain relative h-[92dvh] min-h-[560px] w-full overflow-hidden">
          {/* Studio photography when Zstudio provides it; until then a low-key camera shot. */}
          <Media
            src={studio?.images[0] ?? "/equipment/sony-a7siii.jpg"}
            alt=""
            priority
            className="absolute inset-0"
            imgClassName="object-[70%_50%] opacity-80"
            label=" "
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/50" />
          <div className="stagger relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-14 sm:px-8 sm:pb-20">
            <p className="eyebrow">
              Cape Town · Equipment &amp; studio hire
            </p>
            <h1 style={{ ["--i" as string]: 1 }} className="mt-5 max-w-4xl font-display text-[clamp(44px,8vw,112px)] leading-[0.95] font-normal tracking-[-0.01em]">
              Light it <em className="text-rose italic">properly.</em>
            </h1>
            <p style={{ ["--i" as string]: 2 }} className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
              Cinema cameras, lighting, backdrops and audio by the day — and a blacked-out studio built for the shot
              you&rsquo;ve been planning.
            </p>
            <div style={{ ["--i" as string]: 3 }} className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/studio" className="btn-primary">
                Book the studio
              </Link>
              <Link href="/equipment" className="btn-ghost">
                Hire equipment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two doors */}
      <section className="mx-auto mt-20 grid max-w-7xl gap-6 px-4 sm:mt-28 sm:px-8 md:grid-cols-2">
        <Link href="/studio" className="card-hover group block">
          <Reveal>
            {studio?.images.length ? (
              <Media
                src={studio.images[1] ?? studio.images[0]}
                alt="The studio"
                sizes="(min-width: 768px) 50vw, 100vw"
                className="aspect-[4/5]"
                imgClassName="card-img"
              />
            ) : (
              <StudioScene className="aspect-[4/5]" />
            )}
          </Reveal>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Studio hire</p>
              <h2 className="mt-2 font-display text-4xl">The Studio</h2>
            </div>
            {studio && <p className="text-sm text-muted tabular-nums">{formatRand(studio.dailyRate)} / day</p>}
          </div>
          <p className="mt-3 text-sm text-muted">{uses.join(" · ")}</p>
        </Link>

        <Link href="/equipment" className="card-hover group block md:mt-24">
          <Reveal>
            <Media
              // The lens shot is the one that survives a portrait crop.
              src={(equipment.find((e) => e.id === "sigma-24-70") ?? equipment[0])?.images[0]}
              alt="Equipment"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[4/5]"
              imgClassName="card-img"
              label="EQUIPMENT"
            />
          </Reveal>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Equipment hire</p>
              <h2 className="mt-2 font-display text-4xl">The Kit Room</h2>
            </div>
            {fromRate > 0 && <p className="text-sm text-muted tabular-nums">from {formatRand(fromRate)} / day</p>}
          </div>
          <p className="mt-3 text-sm text-muted">{categories.join(" · ")}</p>
        </Link>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-8">
        <p className="eyebrow">How booking works</p>
        <ol className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
          {[
            ["Choose", "Add gear, the studio, or both to your hire."],
            ["Pick dates", "The calendar only shows days that are free."],
            ["Enquire", "Send your details. We hold it for 48 hours."],
            ["Pay by EFT", "Use your reference. Send proof of payment — done."],
          ].map(([title, body], i) => (
            <li key={title} className="bg-ink p-6 sm:p-8">
              <span className="font-display text-sm text-rose tabular-nums">0{i + 1}</span>
              <p className="mt-6 font-display text-2xl">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
        <Link href="/equipment" className="link-underline mt-8 inline-flex items-center gap-2 text-sm text-muted">
          Start with equipment <ArrowRight size={14} />
        </Link>
      </section>
    </>
  );
}
