"use client";

import { useRouter } from "next/navigation";
import { useCart, type CartItem } from "@/stores/cart";

/** Studio is always qty 1: add if missing, then go straight to dates. */
export function BookStudioButton({ item }: { item: Omit<CartItem, "qty"> }) {
  const router = useRouter();
  const add = useCart((s) => s.add);

  return (
    <button
      type="button"
      className="btn-primary mt-6 w-full lg:w-auto"
      onClick={() => {
        const inCart = useCart.getState().items.some((i) => i.resourceId === item.resourceId);
        if (!inCart) add(item, 1);
        router.push("/book/dates");
      }}
    >
      Check dates
    </button>
  );
}
