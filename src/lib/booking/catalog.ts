import "server-only";
import { cache } from "react";
import { usedUnits } from "./availability";
import { todaySA } from "./dates";
import { getStore } from "./store";
import { blockedDateId, type Resource } from "./types";
import type { CartItem } from "@/stores/cart";

export const listEquipment = cache(async () => (await getStore()).listResources("equipment"));
export const getStudio = cache(async () => (await (await getStore()).listResources("studio"))[0] ?? null);
export const getBySlug = cache(async (slug: string) => (await getStore()).getResourceBySlug(slug));

export type Workshop = Resource & { date: string; seatsLeft: number };

/** Upcoming workshops, soonest first, with live seat counts from the same holds as gear. */
export const listUpcomingWorkshops = cache(async (): Promise<Workshop[]> => {
  const store = await getStore();
  const today = todaySA();
  const workshops = (await store.listResources("workshop"))
    .filter((w): w is Resource & { date: string } => Boolean(w.date) && w.date! >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!workshops.length) return [];

  const dates = workshops.map((w) => w.date).sort();
  const docs = await store.queryBlockedDates(
    workshops.map((w) => w.id),
    dates[0],
    dates[dates.length - 1],
  );
  const now = Date.now();
  return workshops.map((w) => ({
    ...w,
    seatsLeft: Math.max(0, w.stock - usedUnits(docs.get(blockedDateId(w.id, w.date)), now)),
  }));
});

export function toCartItem(r: Resource): Omit<CartItem, "qty"> {
  return {
    resourceId: r.id,
    kind: r.kind,
    slug: r.slug,
    name: r.name,
    category: r.category,
    dailyRate: r.dailyRate,
    stock: r.stock,
    image: r.images[0],
  };
}
