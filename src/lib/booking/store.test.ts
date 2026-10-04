import { describe, expect, it } from "vitest";
import { freshMemoryDb, MemoryStore } from "./store-memory";
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
  const fresh = () => new MemoryStore(freshMemoryDb());

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

describe("MemoryStore admin actions", () => {
  const fresh = () => new MemoryStore(freshMemoryDb());

  it("confirming makes the hold permanent", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "sony-fx3", qty: 2 }], dates, booking("ZS-300101-EEEE", 2));
    const confirmed = await store.confirmBooking("ZS-300101-EEEE", "staff@example.com", Date.now());
    expect(confirmed.status).toBe("confirmed");
    // Long after the original 1h expiry the stock is still blocked.
    const later = Date.now() + 10 * 3_600_000;
    const docs = await store.queryBlockedDates(["sony-fx3"], dates[0], dates[1]);
    for (const doc of docs.values()) expect(doc.holds["ZS-300101-EEEE"]).toEqual({ qty: 2, status: "confirmed", expiresAt: null });
    await expect(
      store.commitEnquiry([{ resourceId: "sony-fx3", qty: 1 }], dates, { ...booking("ZS-300101-FFFF"), createdAt: later }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to confirm an expired hold whose stock was taken since", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "sony-fx3", qty: 2 }], dates, { ...booking("ZS-300101-GGGG", 2), expiresAt: Date.now() + 1 });
    await new Promise((r) => setTimeout(r, 5)); // let the hold expire
    await store.commitEnquiry([{ resourceId: "sony-fx3", qty: 1 }], dates, booking("ZS-300101-HHHH"));
    await expect(store.confirmBooking("ZS-300101-GGGG", "staff", Date.now())).rejects.toBeInstanceOf(ConflictError);
  });

  it("confirms an expired hold when the stock is still free", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "sony-fx3", qty: 1 }], dates, { ...booking("ZS-300101-JJJJ"), expiresAt: Date.now() + 1 });
    await new Promise((r) => setTimeout(r, 5));
    expect((await store.confirmBooking("ZS-300101-JJJJ", "staff", Date.now())).status).toBe("confirmed");
  });

  it("releasing frees the stock and can't be done twice", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "sony-fx3", qty: 2 }], dates, booking("ZS-300101-KKKK", 2));
    await store.releaseBooking("ZS-300101-KKKK", "staff", Date.now());
    await store.commitEnquiry([{ resourceId: "sony-fx3", qty: 2 }], dates, booking("ZS-300101-MMMM", 2));
    await expect(store.releaseBooking("ZS-300101-KKKK", "staff", Date.now())).rejects.toThrow(/already released/);
    await expect(store.confirmBooking("ZS-300101-KKKK", "staff", Date.now())).rejects.toThrow(/already released/);
  });
});
