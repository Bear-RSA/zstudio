"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  value: number;
  max: number;
  onChange: (qty: number) => void;
  className?: string;
  label: string;
}

// No animation: steppers get clicked repeatedly in quick succession.
export function QtyStepper({ value, max, onChange, className, label }: Props) {
  return (
    <div className={cn("inline-flex h-10 items-center border border-line", className)} role="group" aria-label={label}>
      <button
        type="button"
        className="press flex h-full w-10 items-center justify-center text-muted disabled:opacity-30"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="press flex h-full w-10 items-center justify-center text-muted disabled:opacity-30"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
