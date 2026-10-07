import { describe, expect, it } from "vitest";
import { addDays, dayCount, expandRange, isIsoDate, todaySA } from "./dates";
import { findConflicts, usedUnits } from "./availability";
import { quote, quoteService, quoteSpace, spaceRates } from "./pricing";
import { dayStartTimes, formatDuration, isOpenDay, slotKeys, slotsUntilClose } from "./slots";
import { generateReference, REFERENCE_PATTERN } from "./reference";
import { formatRand } from "../money";
import type { BlockedDate, Resource } from "./types";

describe("dates", () => {
  it("expands an inclusive range across a month boundary", () => {
    expect(expandRange("2026-10-30", "2026-11-02")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  it("handles leap years", () => {
    expect(expandRange("2028-02-28", "2028-03-01")).toHaveLength(3);
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("counts days inclusively", () => {
    expect(dayCount("2026-10-05", "2026-10-07")).toBe(3);
    expect(dayCount("2026-10-05", "2026-10-05")).toBe(1);
  });

  it("rejects reversed ranges", () => {
    expect(() => expandRange("2026-10-07", "2026-10-05")).toThrow();
  });

  it("validates ISO dates", () => {
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2026-1-01")).toBe(false);
  });

  it("returns SA date, not UTC date", () => {
    // 23:30 UTC on 4 Oct is 01:30 on 5 Oct in Johannesburg.
    expect(todaySA(new Date("2026-10-04T23:30:00Z"))).toBe("2026-10-05");
  });
});

describe("availability", () => {
  const now = 1_000_000;
  const doc: BlockedDate = {
    resourceId: "led",
    date: "2026-10-05",
    holds: {
      A: { qty: 1, status: "confirmed", expiresAt: null },
      B: { qty: 1, status: "held", expiresAt: now + 1 },
      C: { qty: 5, status: "held", expiresAt: now - 1 }, // expired
    },
  };

  it("ignores expired holds", () => {
    expect(usedUnits(doc, now)).toBe(2);
    expect(usedUnits(undefined, now)).toBe(0);
  });

  it("flags only dates that exceed stock", () => {
    const docs = new Map([["led_2026-10-05", doc]]);
    const dates = ["2026-10-04", "2026-10-05"];
    expect(findConflicts([{ resourceId: "led", qty: 1 }], dates, { led: 3 }, docs, now)).toEqual([]);
    expect(findConflicts([{ resourceId: "led", qty: 2 }], dates, { led: 3 }, docs, now)).toEqual([
      { resourceId: "led", date: "2026-10-05", available: 1, requested: 2 },
    ]);
  });

  it("treats unknown resources as zero stock", () => {
    expect(findConflicts([{ resourceId: "x", qty: 1 }], ["2026-10-05"], {}, new Map(), now)).toHaveLength(1);
  });
});

describe("pricing", () => {
  const r = (id: string, dailyRate: number): Resource => ({
    id,
    kind: "equipment",
    slug: id,
    name: id,
    category: "x",
    description: "",
    specs: [],
    dailyRate,
    stock: 3,
    images: [],
    active: true,
    sortOrder: 0,
  });

  it("multiplies rate × qty × days", () => {
    const resources = new Map([
      ["a", r("a", 450)],
      ["b", r("b", 1200)],
    ]);
    const q = quote(
      [
        { resourceId: "a", qty: 2 },
        { resourceId: "b", qty: 1 },
      ],
      resources,
      3,
    );
    expect(q.lines.map((l) => l.lineTotal)).toEqual([2700, 3600]);
    expect(q.total).toBe(6300);
  });
});

describe("reference + money", () => {
  it("generates readable references", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateReference(new Date("2026-10-04T10:00:00Z"))).toMatch(REFERENCE_PATTERN);
    }
    expect(generateReference(new Date("2026-10-04T10:00:00Z")).startsWith("ZS-261004-")).toBe(true);
  });

  it("formats Rand", () => {
    expect(formatRand(1250)).toBe("R1,250");
    expect(formatRand(85)).toBe("R85");
    expect(formatRand(1_250_000)).toBe("R1,250,000");
  });
});

describe("studio slots", () => {
  it("offers half-hour starts within opening hours", () => {
    const times = dayStartTimes();
    expect(times[0]).toBe("08:00");
    expect(times.at(-1)).toBe("16:30");
    expect(times).toHaveLength(18);
    expect(slotsUntilClose("15:30")).toBe(3);
  });

  it("keys consecutive slots", () => {
    expect(slotKeys("2026-10-08", "10:30", 3)).toEqual(["2026-10-08T10:30", "2026-10-08T11:00", "2026-10-08T11:30"]);
  });

  it("is closed on Sundays", () => {
    expect(isOpenDay("2026-10-11")).toBe(false); // Sunday
    expect(isOpenDay("2026-10-10")).toBe(true); // Saturday
  });

  it("formats durations", () => {
    expect([1, 2, 3, 4].map(formatDuration)).toEqual(["30 min", "1 hour", "1½ hours", "2 hours"]);
  });

  it("prices a space by the half hour", () => {
    const boardroom: Resource = {
      id: "boardroom",
      kind: "studio",
      slug: "boardroom",
      name: "Boardroom",
      category: "Studio",
      description: "",
      specs: [],
      dailyRate: 150,
      minSlots: 2,
      stock: 1,
      images: [],
      active: true,
      sortOrder: 0,
    };
    expect(quoteSpace(boardroom, 3).total).toBe(450);
    expect(spaceRates(boardroom)).toEqual([{ amount: 300, unit: "per hour" }]);
    expect(spaceRates({ dailyRate: 400 })).toEqual([
      { amount: 400, unit: "for 30 minutes" },
      { amount: 800, unit: "for 1 hour" },
    ]);
  });
});

describe("service packages", () => {
  it("prices per person when the package says so", () => {
    const headshots = { id: "headshots", kind: "service", name: "Headshots" } as Resource;
    const pkg = { id: "per-person", label: "30 minutes per person", slots: 1, price: 1000, location: "studio" as const, perPerson: true };
    const q = quoteService(headshots, pkg, 3);
    expect(q.total).toBe(3000);
    expect(q.lines[0]).toMatchObject({ name: "Headshots · 30 minutes per person", qty: 3, dailyRate: 1000 });
  });
});
