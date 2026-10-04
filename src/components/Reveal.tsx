"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * One-time clip-path reveal when scrolled into view. Content is visible by default
 * (server HTML, no-JS, already-on-screen); only elements that start off-screen are
 * armed and revealed as they scroll in.
 */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already visible at mount: leave it alone — revealing it would explain nothing.
    if (el.getBoundingClientRect().top < window.innerHeight - 100) return;

    setArmed(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -100px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-armed={armed} data-revealed={revealed} className={cn("reveal", className)}>
      {children}
    </div>
  );
}
