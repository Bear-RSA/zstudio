import "server-only";
import { z } from "zod";
import type { Booking } from "./types";

// DEMO_MODE runs on in-memory data, and serverless instances don't share memory: the
// confirmation page may land on an instance that never saw the booking. In demo mode the
// redirect carries this non-personal summary (the page shows no customer details anyway).

const summarySchema = z.object({
  reference: z.string().max(20),
  items: z
    .array(
      z.object({
        resourceId: z.string().max(100),
        kind: z.enum(["equipment", "studio", "workshop", "service"]),
        name: z.string().max(120),
        qty: z.number().int().min(1).max(50),
        dailyRate: z.number().int().min(0),
        lineTotal: z.number().int().min(0),
      }),
    )
    .max(30),
  startDate: z.string().max(10),
  endDate: z.string().max(10),
  days: z.number().int().min(1).max(366),
  total: z.number().int().min(0),
  details: z.string().max(200).optional(),
  slots: z.array(z.string().max(16)).max(24).optional(),
  service: z
    .object({
      packageId: z.string().max(60),
      packageLabel: z.string().max(80),
      location: z.enum(["studio", "outdoor"]),
      roomId: z.string().max(100).optional(),
      roomName: z.string().max(120).optional(),
      people: z.number().int().min(1).max(20),
    })
    .optional(),
  startTime: z.string().max(5).optional(),
  endTime: z.string().max(5).optional(),
  createdAt: z.number(),
  expiresAt: z.number(),
});

export function encodeDemoSummary(b: Booking): string {
  const { reference, items, startDate, endDate, days, total, details, slots, startTime, endTime, service, createdAt, expiresAt } = b;
  return Buffer.from(
    JSON.stringify({ reference, items, startDate, endDate, days, total, details, slots, startTime, endTime, service, createdAt, expiresAt }),
  ).toString(
    "base64url",
  );
}

export function decodeDemoSummary(encoded: string, reference: string): Booking | null {
  try {
    const s = summarySchema.parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
    if (s.reference !== reference) return null;
    return { ...s, status: "held", customer: { fullName: "", email: "", phone: "" } };
  } catch {
    return null;
  }
}
