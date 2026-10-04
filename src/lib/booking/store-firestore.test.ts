// Runs only against the Firestore emulator: npm run test:emulator
import { beforeAll, describe, expect, it } from "vitest";
import { ConflictError } from "./store";
import { seedResources } from "./seed-data";
import type { Booking } from "./types";

const enabled = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

describe.skipIf(!enabled)("FirestoreStore (emulator)", () => {
  let store: import("./store-firestore").FirestoreStore;

  beforeAll(async () => {
    const { FirestoreStore } = await import("./store-firestore");
    const { db } = await import("@/lib/firebase/admin");
    const batch = db().batch();
    for (const { id, ...r } of seedResources) batch.set(db().collection("resources").doc(id), r);
    await batch.commit();
    store = new FirestoreStore();
  });

  const run = Math.random().toString(36).slice(2, 6).toUpperCase();
  const booking = (suffix: string): Booking => ({
    reference: `ZS-300201-${suffix}`,
    status: "held",
    items: [{ resourceId: "studio-main", kind: "studio", name: "The Studio", qty: 1, dailyRate: 3500, lineTotal: 3500 }],
    startDate: "2030-02-01",
    endDate: "2030-02-01",
    days: 1,
    total: 3500,
    customer: { fullName: "Test", email: "t@example.com", phone: "0820000000", idNumber: "TEST000" },
    createdAt: Date.now(),
    expiresAt: Date.now() + 3_600_000,
  });

  it("lets exactly one of five concurrent enquiries book the studio", async () => {
    // Studio stock is 1. Use a fresh date per run so reruns don't collide.
    const day = `2030-02-${String(1 + (Date.now() % 27)).padStart(2, "0")}`;
    const results = await Promise.allSettled(
      ["A", "B", "C", "D", "E"].map((s) =>
        store.commitEnquiry([{ resourceId: "studio-main", qty: 1 }], [day], {
          ...booking(`${run}${s}`),
          startDate: day,
          endDate: day,
        }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of results) if (r.status === "rejected") expect(r.reason).toBeInstanceOf(ConflictError);

    const docs = await store.queryBlockedDates(["studio-main"], day, day);
    expect(Object.keys([...docs.values()][0].holds)).toHaveLength(1);
  });
});
