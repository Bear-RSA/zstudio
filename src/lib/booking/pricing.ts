import type { CartLine, Quote, Resource, ServicePackage } from "./types";

/**
 * Builds a quote from authoritative resource data. Always run on the server
 * at submit time; the client's numbers are display-only.
 */
export function quote(lines: CartLine[], resources: Map<string, Resource>, days: number): Quote {
  const out = lines.map((line) => {
    const r = resources.get(line.resourceId);
    if (!r) throw new Error(`Unknown resource ${line.resourceId}`);
    return {
      resourceId: r.id,
      kind: r.kind,
      name: r.name,
      qty: line.qty,
      dailyRate: r.dailyRate,
      lineTotal: r.dailyRate * line.qty * days,
    };
  });
  return { lines: out, days, total: out.reduce((sum, l) => sum + l.lineTotal, 0) };
}

/** A studio space for `slots` half-hours. dailyRate is the 30-minute rate. */
export function quoteSpace(space: Resource, slots: number): Quote {
  const line = { resourceId: space.id, kind: space.kind, name: space.name, qty: 1, dailyRate: space.dailyRate, lineTotal: space.dailyRate * slots };
  return { lines: [line], days: 1, total: line.lineTotal };
}

/** A production package for `people` (1 unless priced per person). */
export function quoteService(service: Resource, pkg: ServicePackage, people: number): Quote {
  const line = { resourceId: service.id, kind: service.kind, name: `${service.name} · ${pkg.label}`, qty: people, dailyRate: pkg.price, lineTotal: pkg.price * people };
  return { lines: [line], days: 1, total: line.lineTotal };
}

/** "/day", "/seat" or "/30 min", after a rate (nothing for service packages). */
export function rateUnit(kind: Resource["kind"]): string {
  return kind === "studio" ? "/30 min" : kind === "workshop" ? "/seat" : kind === "service" ? "" : "/day";
}

/** A space's headline prices: 30 minutes and 1 hour, or just hourly when the minimum is an hour. */
export function spaceRates(space: Pick<Resource, "dailyRate" | "minSlots">): { amount: number; unit: string }[] {
  const hour = { amount: space.dailyRate * 2, unit: "per hour" };
  return (space.minSlots ?? 1) >= 2 ? [hour] : [{ amount: space.dailyRate, unit: "for 30 minutes" }, { ...hour, unit: "for 1 hour" }];
}
