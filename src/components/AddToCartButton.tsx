"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart, type CartItem } from "@/stores/cart";
import { cn } from "@/lib/cn";

interface Props {
  item: Omit<CartItem, "qty">;
  qty?: number;
  className?: string;
  variant?: "primary" | "ghost";
  label?: string;
}

/** Morphs to "Added" with a short blur crossfade so the state change reads as one motion. */
export function AddToCartButton({ item, qty = 1, className, variant = "primary", label = "Add to hire" }: Props) {
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.find((i) => i.resourceId === item.resourceId)?.qty ?? 0);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const full = inCart >= item.stock;

  return (
    <button
      type="button"
      disabled={full}
      onClick={() => {
        add(item, qty);
        setAdded(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setAdded(false), 1400);
      }}
      className={cn(variant === "primary" ? "btn-primary" : "btn-ghost", "relative", className)}
    >
      <span className="morph" data-hidden={added}>
        {full ? "All in your hire" : label}
      </span>
      <span className="morph absolute inset-0 flex items-center justify-center gap-2" data-hidden={!added} aria-hidden={!added}>
        <Check size={14} strokeWidth={2.5} /> Added
      </span>
    </button>
  );
}
