// en-ZA groups with non-breaking spaces; the brand wants R1,250, so use en-US grouping.
const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** R1,250 — whole Rand. */
export function formatRand(amount: number): string {
  return `R${fmt.format(amount)}`;
}
