import type { BlockedDate, CartLine, Hold } from "./types";
import { blockedDateId } from "./types";

/** A hold blocks stock if it's confirmed, or held and not yet expired. */
export function isActiveHold(hold: Hold, now: number): boolean {
  if (hold.status === "confirmed") return true;
  return hold.expiresAt !== null && hold.expiresAt > now;
}

export function usedUnits(doc: BlockedDate | undefined, now: number): number {
  if (!doc) return 0;
  let used = 0;
  for (const hold of Object.values(doc.holds ?? {})) {
    if (isActiveHold(hold, now)) used += hold.qty;
  }
  return used;
}

export interface Conflict {
  resourceId: string;
  date: string;
  available: number;
  requested: number;
}

/**
 * Pure core: given stock levels and the blockedDates docs that exist for each
 * resource × date, return every (resource, date) where the request won't fit.
 */
export function findConflicts(
  lines: CartLine[],
  dates: string[],
  stock: Record<string, number>,
  docs: Map<string, BlockedDate>,
  now: number,
): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const line of lines) {
    const total = stock[line.resourceId] ?? 0;
    for (const date of dates) {
      const used = usedUnits(docs.get(blockedDateId(line.resourceId, date)), now);
      const available = Math.max(0, total - used);
      if (line.qty > available) {
        conflicts.push({ resourceId: line.resourceId, date, available, requested: line.qty });
      }
    }
  }
  return conflicts;
}
