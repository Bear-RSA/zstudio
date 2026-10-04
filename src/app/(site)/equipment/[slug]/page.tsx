import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Media } from "@/components/Media";
import { Reveal } from "@/components/Reveal";
import { getBySlug, toCartItem } from "@/lib/booking/catalog";
import { formatRand } from "@/lib/money";
import { AddWithQty } from "./AddWithQty";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getBySlug((await params).slug);
  return item ? { title: `${item.name} hire`, description: item.description } : {};
}

export default async function EquipmentItemPage({ params }: Props) {
  const item = await getBySlug((await params).slug);
  if (!item || item.kind !== "equipment") notFound();

  const gallery = item.images.length ? item.images : [undefined];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 sm:pt-12">
      <Link href="/equipment" className="link-underline inline-flex items-center gap-2 text-sm text-muted">
        <ArrowLeft size={14} /> All equipment
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <div className="grid gap-4">
          {gallery.map((id, i) => {
            const media = (
              <Media
                src={id}
                alt={`${item.name}${i ? ` — view ${i + 1}` : ""}`}
                priority={i === 0}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="aspect-[4/3]"
                label={item.category.toUpperCase()}
                showCredit
              />
            );
            // The primary image is the page's main content: show it immediately.
            return i === 0 ? <div key={id ?? i}>{media}</div> : <Reveal key={id ?? i}>{media}</Reveal>;
          })}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{item.category}</p>
          <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] leading-[1.05]">{item.name}</h1>
          <p className="mt-4 font-display text-2xl tabular-nums">
            {formatRand(item.dailyRate)} <span className="font-sans text-sm text-muted">per day</span>
          </p>
          <p className="mt-6 text-[15px] leading-relaxed text-muted">{item.description}</p>

          {item.specs.length > 0 && (
            <ul className="mt-8 border-t border-line">
              {item.specs.map((s) => (
                <li key={s} className="border-b border-line py-3 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          )}

          <AddWithQty item={toCartItem(item)} />
          <p className="mt-4 text-xs text-muted">
            {item.stock} {item.stock === 1 ? "unit" : "units"} in the kit room. You&rsquo;ll pick dates next — we only
            show days that are free.
          </p>
        </div>
      </div>
    </div>
  );
}
