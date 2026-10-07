import { describe, expect, it } from "vitest";
import { billableDays, isBusinessDay, nextBusinessDay, publicHoliday } from "./holidays";
import { isOpenDay } from "./slots";

describe("public holidays", () => {
  it("knows fixed and Easter holidays", () => {
    expect(publicHoliday("2026-12-16")).toBe("Day of Reconciliation");
    expect(publicHoliday("2026-04-03")).toBe("Good Friday");
    expect(publicHoliday("2026-04-06")).toBe("Family Day");
    expect(publicHoliday("2026-10-07")).toBeNull();
  });

  it("moves a Sunday holiday to the Monday", () => {
    // Heritage Day 2028 is a Sunday.
    expect(publicHoliday("2028-09-25")).toBe("Heritage Day (observed)");
  });
});

describe("business days", () => {
  it("excludes weekends and holidays", () => {
    expect(isBusinessDay("2026-10-09")).toBe(true); // Friday
    expect(isBusinessDay("2026-10-10")).toBe(false); // Saturday
    expect(isBusinessDay("2026-12-16")).toBe(false);
  });

  it("returns Friday gear on Monday and charges one day", () => {
    expect(nextBusinessDay("2026-10-09")).toBe("2026-10-12");
    expect(billableDays("2026-10-09", "2026-10-09")).toBe(1);
  });

  it("doesn't charge the weekend inside a range", () => {
    expect(billableDays("2026-10-09", "2026-10-12")).toBe(2); // Fri → Mon
    expect(billableDays("2026-12-15", "2026-12-17")).toBe(2); // across Day of Reconciliation
  });

  it("closes studios on public holidays", () => {
    expect(isOpenDay("2026-12-16")).toBe(false);
    expect(isOpenDay("2026-10-10")).toBe(true); // Saturday
  });
});
