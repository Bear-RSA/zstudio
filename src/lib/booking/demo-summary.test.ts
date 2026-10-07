import { describe, expect, it } from "vitest";
import { decodeDemoSummary, encodeDemoSummary } from "./demo-summary";
import type { Booking } from "./types";

const booking: Booking = {
  reference: "ZS-261004-ABCD",
  status: "held",
  items: [{ resourceId: "canon-eos-r6-mark-ii-body", kind: "equipment", name: "Canon EOS R6 Mark II Body", qty: 1, dailyRate: 2000, lineTotal: 6000 }],
  startDate: "2026-10-05",
  endDate: "2026-10-07",
  days: 3,
  total: 6000,
  customer: { fullName: "Private Person", email: "private@example.com", phone: "0820000000", idNumber: "SECRET" },
  createdAt: 1,
  expiresAt: 2,
};

describe("demo confirmation summary", () => {
  it("round-trips the booking summary without any customer details", () => {
    const encoded = encodeDemoSummary(booking);
    expect(Buffer.from(encoded, "base64url").toString()).not.toMatch(/Private|private@|SECRET|0820000000/);
    const decoded = decodeDemoSummary(encoded, booking.reference)!;
    expect(decoded.total).toBe(6000);
    expect(decoded.items).toEqual(booking.items);
    expect(decoded.customer).toEqual({ fullName: "", email: "", phone: "" });
  });

  it("rejects a summary for a different reference or garbage", () => {
    expect(decodeDemoSummary(encodeDemoSummary(booking), "ZS-261004-WXYZ")).toBeNull();
    expect(decodeDemoSummary("not-base64-json", booking.reference)).toBeNull();
  });
});
