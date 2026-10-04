"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart, useHydrated } from "@/stores/cart";

/** Sends the user back a step if the cart (or dates) they need aren't there. */
export function useCartGuard({ needDates }: { needDates: boolean }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const empty = useCart((s) => s.items.length === 0);
  const noDates = useCart((s) => !s.startDate || !s.endDate);

  const redirectTo = !hydrated ? null : empty ? "/equipment" : needDates && noDates ? "/book/dates" : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  return { ready: hydrated && !redirectTo };
}
