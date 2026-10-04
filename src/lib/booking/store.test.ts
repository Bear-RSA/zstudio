import { describe, expect, it } from "vitest";
import { MemoryStore } from "./store-memory";
import { ConflictError } from "./store";
import type { Booking } from "./types";

const booking = (reference: string, qty = 1): Booking => ({
  reference,
  status: "held",
  items: [{ resourceId: "sony-fx3", kind: "equipment", name: "Sony FX3", qty, dailyRate: 1250, lineTotal: 1250 * qty }],
  startDate: "2030-01-10",
  endDate: "2030-01-11",
  days: 2,
  total: 2500 * qty,
  customer: { fullName: "Test", email: "t@example.com", phone: "0820000000", idNumber: "TEST000" },
  createdAt: Date.now(),
  expiresAt: Date.now() + 3_600_000,
});

const dates = ["2030-01-10", "2030-01-11"];

describe("MemoryStore.commitEnquiry", () => {
  const fresh = () => new MemoryStore({ blocked: new Map(), bookings: new Map() });

  it("lets exactly one of two concurrent enquiries take the last unit", async () => {
    const store = fresh();
    // FX3 stock is 2: take one, then race two enquiries for the remaining unit.
    await store.commitEnquiry([{ resourceId: "sony-fx3", qty: 1 }], dates, booking("ZS-300101-AAAA"));
    const results = await Promise.allSettled([
      store.commitEnquiry([{ resourceId: "sony-fx3", qty: 1 }], dates, booking("ZS-300101-BBBB")),
      store.commitEnquiry([{ resourceId: "sony-fx3", qty: 1 }], dates, booking("ZS-300101-CCCC")),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictError);
  });

  it("rejects a request larger than stock and writes nothing", async () => {
    const store = fresh();
    await expect(
      store.commitEnquiry([{ resourceId: "sony-fx3", qty: 3 }], dates, booking("ZS-300101-DDDD", 3)),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(await store.getBooking("ZS-300101-DDDD")).toBeNull();
    expect((await store.queryBlockedDates(["sony-fx3"], "2030-01-01", "2030-01-31")).size).toBe(0);
  });
});
