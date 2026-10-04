"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ResourceKind } from "@/lib/booking/types";

/** Display snapshot only. Prices are recomputed on the server at submit. */
export interface CartItem {
  resourceId: string;
  kind: ResourceKind;
  slug: string;
  name: string;
  category: string;
  dailyRate: number;
  stock: number;
  image?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  startDate: string | null;
  endDate: string | null;
  drawerOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (resourceId: string, qty: number) => void;
  remove: (resourceId: string) => void;
  setDates: (start: string | null, end: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      startDate: null,
      endDate: null,
      drawerOpen: false,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.resourceId === item.resourceId);
          const items = existing
            ? s.items.map((i) =>
                i.resourceId === item.resourceId ? { ...i, ...item, qty: Math.min(i.qty + qty, item.stock) } : i,
              )
            : [...s.items, { ...item, qty: Math.min(qty, item.stock) }];
          return { items };
        }),
      setQty: (resourceId, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.resourceId === resourceId ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i)),
        })),
      remove: (resourceId) => set((s) => ({ items: s.items.filter((i) => i.resourceId !== resourceId) })),
      setDates: (startDate, endDate) => set({ startDate, endDate }),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      clear: () => set({ items: [], startDate: null, endDate: null }),
    }),
    {
      name: "zs-cart",
      version: 1,
      // Rehydrated in <CartHydrator /> after mount so SSR and first client render match.
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, startDate: s.startDate, endDate: s.endDate }),
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.qty, 0);

/**
 * True once the persisted cart has been loaded from localStorage.
 * `useCart.persist` is undefined during SSR (no localStorage), hence `?.`.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(() => useCart.persist?.hasHydrated() ?? false);
  useEffect(() => {
    if (useCart.persist.hasHydrated()) setHydrated(true);
    return useCart.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

export function CartHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return null;
}
