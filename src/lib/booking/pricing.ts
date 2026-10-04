import type { CartLine, Quote, Resource } from "./types";

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
