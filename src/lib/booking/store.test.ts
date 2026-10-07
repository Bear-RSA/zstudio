import { describe, expect, it } from "vitest";
import { freshMemoryDb, MemoryStore } from "./store-memory";
import { ConflictError } from "./store";
import type { Booking, Resource } from "./types";

// A fixture with stock 2, so the tests don't depend on the real inventory's stock levels.
const camera: Resource = {
  id: "test-camera",
  kind: "equipment",
  slug: "test-camera",
  name: "Test Camera",
  category: "Cameras",
  description: "",
  specs: [],
  dailyRate: 2000,
  stock: 2,
  images: [],
  active: true,
  sortOrder: 0,
};

const booking = (reference: string, qty = 1): Booking => ({
  reference,
  status: "held",
  items: [{ resourceId: "test-camera", kind: "equipment", name: "Test Camera", qty, dailyRate: 2000, lineTotal: 2000 * qty }],
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
  const fresh = () => {
    const db = freshMemoryDb();
    db.resources.set(camera.id, structuredClone(camera));
    return new MemoryStore(db);
  };

  it("lets exactly one of two concurrent enquiries take the last unit", async () => {
    const store = fresh();
    // Stock is 2: take one, then race two enquiries for the remaining unit.
    await store.commitEnquiry([{ resourceId: "test-camera", qty: 1 }], dates, booking("ZS-300101-AAAA"));
    const results = await Promise.allSettled([
      store.commitEnquiry([{ resourceId: "test-camera", qty: 1 }], dates, booking("ZS-300101-BBBB")),
      store.commitEnquiry([{ resourceId: "test-camera", qty: 1 }], dates, booking("ZS-300101-CCCC")),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(ConflictError);
  });

  it("rejects a request larger than stock and writes nothing", async () => {
    const store = fresh();
    await expect(
      store.commitEnquiry([{ resourceId: "test-camera", qty: 3 }], dates, booking("ZS-300101-DDDD", 3)),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(await store.getBooking("ZS-300101-DDDD")).toBeNull();
    expect((await store.queryBlockedDates(["test-camera"], "2030-01-01", "2030-01-31")).size).toBe(0);
  });
});

describe("MemoryStore admin actions", () => {
  const fresh = () => {
    const db = freshMemoryDb();
    db.resources.set(camera.id, structuredClone(camera));
    return new MemoryStore(db);
  };

  it("confirming makes the hold permanent", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "test-camera", qty: 2 }], dates, booking("ZS-300101-EEEE", 2));
    const confirmed = await store.confirmBooking("ZS-300101-EEEE", "staff@example.com", Date.now());
    expect(confirmed.status).toBe("confirmed");
    // Long after the original 1h expiry the stock is still blocked.
    const later = Date.now() + 10 * 3_600_000;
    const docs = await store.queryBlockedDates(["test-camera"], dates[0], dates[1]);
    for (const doc of docs.values()) expect(doc.holds["ZS-300101-EEEE"]).toEqual({ qty: 2, status: "confirmed", expiresAt: null });
    await expect(
      store.commitEnquiry([{ resourceId: "test-camera", qty: 1 }], dates, { ...booking("ZS-300101-FFFF"), createdAt: later }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses to confirm an expired hold whose stock was taken since", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "test-camera", qty: 2 }], dates, { ...booking("ZS-300101-GGGG", 2), expiresAt: Date.now() + 1 });
    await new Promise((r) => setTimeout(r, 5)); // let the hold expire
    await store.commitEnquiry([{ resourceId: "test-camera", qty: 1 }], dates, booking("ZS-300101-HHHH"));
    await expect(store.confirmBooking("ZS-300101-GGGG", "staff", Date.now())).rejects.toBeInstanceOf(ConflictError);
  });

  it("confirms an expired hold when the stock is still free", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "test-camera", qty: 1 }], dates, { ...booking("ZS-300101-JJJJ"), expiresAt: Date.now() + 1 });
    await new Promise((r) => setTimeout(r, 5));
    expect((await store.confirmBooking("ZS-300101-JJJJ", "staff", Date.now())).status).toBe("confirmed");
  });

  it("releasing frees the stock and can't be done twice", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: "test-camera", qty: 2 }], dates, booking("ZS-300101-KKKK", 2));
    await store.releaseBooking("ZS-300101-KKKK", "staff", Date.now());
    await store.commitEnquiry([{ resourceId: "test-camera", qty: 2 }], dates, booking("ZS-300101-MMMM", 2));
    await expect(store.releaseBooking("ZS-300101-KKKK", "staff", Date.now())).rejects.toThrow(/already released/);
    await expect(store.confirmBooking("ZS-300101-KKKK", "staff", Date.now())).rejects.toThrow(/already released/);
  });
});

describe("MemoryStore studio slots", () => {
  const space: Resource = { ...camera, id: "test-space", slug: "test-space", kind: "studio", stock: 1, dailyRate: 400 };
  const fresh = () => {
    const db = freshMemoryDb();
    db.resources.set(space.id, structuredClone(space));
    return new MemoryStore(db);
  };
  const slotBooking = (reference: string, slots: string[]): Booking => ({
    ...booking(reference),
    items: [{ resourceId: space.id, kind: "studio", name: "Test Space", qty: 1, dailyRate: 400, lineTotal: 400 * slots.length }],
    startDate: "2030-01-10",
    endDate: "2030-01-10",
    days: 1,
    total: 400 * slots.length,
    slots,
  });
  const ten = ["2030-01-10T10:00", "2030-01-10T10:30"];

  it("blocks overlapping slots but not neighbouring ones", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: space.id, qty: 1 }], ten, slotBooking("ZS-300101-SAAA", ten));
    const overlap = ["2030-01-10T10:30", "2030-01-10T11:00"];
    await expect(
      store.commitEnquiry([{ resourceId: space.id, qty: 1 }], overlap, slotBooking("ZS-300101-SBBB", overlap)),
    ).rejects.toBeInstanceOf(ConflictError);
    const after = ["2030-01-10T11:00"];
    await store.commitEnquiry([{ resourceId: space.id, qty: 1 }], after, slotBooking("ZS-300101-SCCC", after));
  });

  it("confirms and releases exactly the booked slots", async () => {
    const store = fresh();
    await store.commitEnquiry([{ resourceId: space.id, qty: 1 }], ten, slotBooking("ZS-300101-SDDD", ten));
    await store.confirmBooking("ZS-300101-SDDD", "staff", Date.now());
    const docs = await store.queryBlockedDates([space.id], "2030-01-10T00:00", "2030-01-10T23:59");
    expect([...docs.values()].map((d) => d.date).sort()).toEqual(ten);
    for (const doc of docs.values()) expect(doc.holds["ZS-300101-SDDD"].status).toBe("confirmed");

    await store.releaseBooking("ZS-300101-SDDD", "staff", Date.now());
    await store.commitEnquiry([{ resourceId: space.id, qty: 1 }], ten, slotBooking("ZS-300101-SEEE", ten));
  });
});

describe("MemoryStore production services", () => {
  const room: Resource = { ...camera, id: "test-room", slug: "test-room", kind: "studio", stock: 1, dailyRate: 400 };
  const team: Resource = { ...camera, id: "test-team", slug: "test-team", kind: "service", stock: 1, dailyRate: 0 };
  const fresh = () => {
    const db = freshMemoryDb();
    for (const r of [room, team]) db.resources.set(r.id, structuredClone(r));
    return new MemoryStore(db);
  };
  const shootLines = [
    { resourceId: team.id, qty: 1 },
    { resourceId: room.id, qty: 1 },
  ];
  // Priced as the service (3 people), held as the team + the room.
  const shoot = (reference: string, slots: string[]): Booking => ({
    ...booking(reference),
    items: [{ resourceId: "headshots", kind: "service", name: "Headshots", qty: 3, dailyRate: 1000, lineTotal: 3000 }],
    startDate: "2030-01-10",
    endDate: "2030-01-10",
    days: 1,
    total: 3000,
    slots,
    holds: shootLines,
  });
  const ten = ["2030-01-10T10:00", "2030-01-10T10:30"];

  it("holds the room and the team, not the priced quantity", async () => {
    const store = fresh();
    await store.commitEnquiry(shootLines, ten, shoot("ZS-300101-PAAA", ten));
    // The room is taken for anyone hiring it…
    await expect(store.commitEnquiry([{ resourceId: room.id, qty: 1 }], ["2030-01-10T10:30"], slotHire("ZS-300101-PBBB"))).rejects.toBeInstanceOf(
      ConflictError,
    );
    // …and the team can't shoot elsewhere at the same time.
    await expect(store.commitEnquiry([{ resourceId: team.id, qty: 1 }], ["2030-01-10T10:00"], slotHire("ZS-300101-PCCC"))).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("confirms and releases its holds", async () => {
    const store = fresh();
    await store.commitEnquiry(shootLines, ten, shoot("ZS-300101-PDDD", ten));
    await store.confirmBooking("ZS-300101-PDDD", "staff", Date.now());
    const docs = await store.queryBlockedDates([room.id, team.id], "2030-01-10T00:00", "2030-01-10T23:59");
    expect(docs.size).toBe(4);
    for (const doc of docs.values()) expect(doc.holds["ZS-300101-PDDD"]).toEqual({ qty: 1, status: "confirmed", expiresAt: null });

    await store.releaseBooking("ZS-300101-PDDD", "staff", Date.now());
    await store.commitEnquiry([{ resourceId: room.id, qty: 1 }], ten, slotHire("ZS-300101-PEEE"));
  });

  function slotHire(reference: string): Booking {
    return { ...booking(reference), items: [{ resourceId: room.id, kind: "studio", name: "Room", qty: 1, dailyRate: 400, lineTotal: 400 }], days: 1, total: 400 };
  }
});
