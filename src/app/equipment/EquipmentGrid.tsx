"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { Media } from "@/components/Media";
import { formatRand } from "@/lib/money";
import { cn } from "@/lib/cn";
import type { CartItem } from "@/stores/cart";

type Item = Omit<CartItem, "qty"> & { description: string };

export function EquipmentGrid({ items }: { items: Item[] }) {
  const categories = useMemo(() => ["All", ...new Set(items.map((i) => i.category))], [items]);
  const [active, setActive] = useState("All");
  // Leaving display:none restarts CSS animations, so drop the stagger once the user filters.
  const [filtered, setFiltered] = useState(false);

  return (
    <>
      {/* Filter chips: colour change only, no motion — used repeatedly. */}
      <div className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setActive(c);
              setFiltered(true);
            }}
            aria-pressed={active === c}
            className={cn(
              "press h-9 shrink-0 border px-4 text-[12px] tracking-[0.14em] uppercase",
              active === c ? "border-rose bg-rose/10 text-rose" : "border-line text-muted",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Stagger plays on first load only; filtering is instant. */}
      <ul className={cn(!filtered && "stagger", "mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3")}>
        {items.map(({ description, ...item }, i) => (
          <li
            key={item.resourceId}
            hidden={active !== "All" && item.category !== active}
            style={{ ["--i" as string]: Math.min(i, 8) }}
            className="card-hover flex flex-col"
          >
            <Link href={`/equipment/${item.slug}`} className="block overflow-hidden">
              <Media
                src={item.image}
                alt={item.name}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="aspect-[4/3]"
                imgClassName="card-img"
                label={item.category.toUpperCase()}
              />
            </Link>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">{item.category}</p>
                <Link href={`/equipment/${item.slug}`} className="link-underline mt-1 block text-lg">
                  {item.name}
                </Link>
              </div>
              <p className="shrink-0 pt-4 text-sm tabular-nums">
                {formatRand(item.dailyRate)}
                <span className="text-muted">/day</span>
              </p>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{description}</p>
            <div className="mt-auto flex items-center justify-between gap-4 pt-5">
              <span className="text-xs text-muted">{item.stock > 1 ? `${item.stock} in stock` : "1 in stock"}</span>
              <AddToCartButton item={item} variant="ghost" className="h-10 px-5" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
