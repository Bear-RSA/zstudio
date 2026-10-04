import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Media } from "@/components/Media";
import { Reveal } from "@/components/Reveal";
import { StudioScene } from "@/components/StudioScene";
import { getStudio, toCartItem } from "@/lib/booking/catalog";
import { formatRand } from "@/lib/money";
import { BookStudioButton } from "./BookStudioButton";

export const metadata: Metadata = {
  title: "Studio hire",
  description: "Book the Z Studios space in Cape Town for photoshoots, podcasts, music videos and headshots.",
};
export const revalidate = 300;

const uses = [
  { title: "Photoshoots", body: "Seamless paper, controllable light, room to move." },
  { title: "Podcasts", body: "Quiet, dark, and camera-ready. Add the podcast kit." },
  { title: "Music videos", body: "Blackout control and power on every wall." },
  { title: "Headshots", body: "Fast turnover between sitters, make-up station on site." },
];

export default async function StudioPage() {
  const studio = await getStudio();
  if (!studio) notFound();
  const [hero, ...rest] = studio.images;
  // Until Zstudio's own studio photos are added, show podcast kit shots in the detail pair.
  const details = rest.length ? rest.slice(0, 2) : ["/equipment/rodecaster-pro.jpg", "/equipment/rode-podmic.png"];

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 sm:pt-16">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">Studio hire · Full days</p>
            <h1 className="mt-3 font-display text-[clamp(44px,7vw,96px)] leading-[0.95]">
              The <em className="text-rose italic">Studio</em>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">{studio.description}</p>
          </div>
          <div className="lg:text-right">
            <p className="font-display text-4xl tabular-nums">{formatRand(studio.dailyRate)}</p>
            <p className="mt-1 text-sm text-muted">per day</p>
            <BookStudioButton item={toCartItem(studio)} />
          </div>
        </div>

        <Reveal className="mt-12">
          {hero ? (
            <Media src={hero} alt="Inside the Z Studios space" priority sizes="100vw" className="aspect-[16/9]" />
          ) : (
            <StudioScene priority className="aspect-[16/9]" />
          )}
        </Reveal>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-8">
        <p className="eyebrow">Made for</p>
        <div className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {uses.map((u) => (
            <div key={u.title} className="bg-ink p-6 sm:p-8">
              <p className="font-display text-2xl">{u.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{u.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-7xl gap-10 px-4 sm:px-8 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          {details.map((id) => (
            <Reveal key={id}>
              <Media src={id} alt="Studio detail" sizes="(min-width: 1024px) 25vw, 50vw" className="aspect-[3/4]" showCredit />
            </Reveal>
          ))}
        </div>
        <div>
          <p className="eyebrow">What&rsquo;s included</p>
          <ul className="mt-6 border-t border-line">
            {studio.specs.map((s) => (
              <li key={s} className="border-b border-line py-4 text-[15px]">
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            Need lights or a camera too? Add them from the kit room — they go on the same booking and the same dates.
          </p>
        </div>
      </section>
    </>
  );
}
