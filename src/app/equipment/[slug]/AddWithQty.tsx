"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/AddToCartButton";
import { QtyStepper } from "@/components/QtyStepper";
import { useCart, type CartItem } from "@/stores/cart";

export function AddWithQty({ item }: { item: Omit<CartItem, "qty"> }) {
  const inCart = useCart((s) => s.items.find((i) => i.resourceId === item.resourceId)?.qty ?? 0);
  const remaining = Math.max(1, item.stock - inCart);
  const [qty, setQty] = useState(1);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);

  return (
    <div className="mt-8">
      <div className="flex gap-3">
        {item.stock > 1 && (
          <QtyStepper value={Math.min(qty, remaining)} max={remaining} onChange={setQty} label="Quantity" className="h-12" />
        )}
        <AddToCartButton item={item} qty={Math.min(qty, remaining)} className="flex-1" />
      </div>
      {inCart > 0 && (
        <button type="button" onClick={() => setDrawerOpen(true)} className="link-underline mt-4 text-sm text-rose">
          {inCart} in your hire — review &amp; choose dates
        </button>
      )}
    </div>
  );
}
