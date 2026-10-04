"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/stores/cart";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      type="button"
      className="btn-ghost relative h-10 px-4"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1600);
        } catch {
          /* clipboard blocked — the reference is still visible to copy by hand */
        }
      }}
    >
      <span className="morph flex items-center gap-2" data-hidden={copied}>
        <Copy size={14} /> Copy
      </span>
      <span className="morph absolute inset-0 flex items-center justify-center gap-2" data-hidden={!copied} aria-hidden={!copied}>
        <Check size={14} /> Copied
      </span>
    </button>
  );
}

export function ClearCart() {
  useEffect(() => {
    // Wait for the persisted cart to load, otherwise rehydration would restore it.
    const clear = () => useCart.getState().clear();
    if (useCart.persist.hasHydrated()) clear();
    return useCart.persist.onFinishHydration(clear);
  }, []);
  return null;
}
