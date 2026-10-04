"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cartCount, CartHydrator, useCart, useHydrated } from "@/stores/cart";
import { CartDrawer } from "./CartDrawer";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/equipment", label: "Equipment" },
  { href: "/studio", label: "The Studio" },
  { href: "/community", label: "Community" },
];

export function SiteHeader({ hasMark }: { hasMark: boolean }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.items));
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);

  // Tick the badge when the count goes up — confirms an add from anywhere on the page.
  const [tickKey, setTickKey] = useState(0);
  const prev = useRef(count);
  useEffect(() => {
    if (hydrated && count > prev.current) setTickKey((k) => k + 1);
    prev.current = count;
  }, [count, hydrated]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <CartHydrator />
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300",
          scrolled ? "border-line bg-ink/85 backdrop-blur-md" : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-8">
          <Link href="/" className="press flex items-center gap-3" aria-label="Z Studios home">
            {hasMark && (
              <Image src="/brand/mark.png" alt="" width={40} height={40} priority className="size-9 sm:size-10" />
            )}
            <span className="wordmark text-[15px] text-bone sm:text-lg">Z&nbsp;STUDIOS</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "link-underline hidden px-2 py-2 text-[12px] tracking-[0.18em] uppercase sm:inline-block",
                  pathname.startsWith(item.href) ? "text-bone decoration-rose!" : "text-muted",
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="press flex h-10 items-center gap-2 border border-line-strong px-4 text-[12px] tracking-[0.18em] uppercase"
              aria-label={`Open hire cart, ${hydrated ? count : 0} items`}
            >
              Hire
              <span
                key={tickKey}
                className={cn(
                  "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] tabular-nums",
                  hydrated && count > 0 ? "bg-rose text-ink" : "bg-raised text-muted",
                  tickKey > 0 && "tick",
                )}
              >
                {hydrated ? count : 0}
              </span>
            </button>
          </nav>
        </div>
        {/* Mobile secondary nav */}
        <nav className="flex border-t border-line sm:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 py-3 text-center text-[11px] tracking-[0.2em] uppercase",
                pathname.startsWith(item.href) ? "text-rose" : "text-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <CartDrawer />
    </>
  );
}
