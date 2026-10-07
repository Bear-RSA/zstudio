import { z } from "zod";
import { isIsoDate } from "@/lib/booking/dates";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24h time, e.g. 09:30");

/** What the inventory editor submits. `id` is fixed once created: holds and bookings reference it. */
export const resourceInputSchema = z
  .object({
    id: z.string().optional(),
    kind: z.enum(["equipment", "studio", "workshop", "service"]),
    name: z.string().trim().min(2, "Name is required").max(120),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and single hyphens only"),
    category: z.string().trim().min(1, "Category is required").max(60),
    description: z.string().trim().max(2000),
    specs: z.array(z.string().trim().min(1).max(200)).max(20),
    dailyRate: z.number().int("Whole Rand only").min(0).max(1_000_000),
    stock: z.number().int().min(0).max(1000),
    images: z.array(z.string().trim().min(1).max(300)).max(12),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(100_000),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    host: z.string().trim().max(120).optional(),
    minSlots: z.number().int().min(1).max(16).optional(),
    packages: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          label: z.string().trim().min(1).max(80),
          slots: z.number().int().min(1).max(17),
          price: z.number().int().min(0).max(1_000_000),
          location: z.enum(["studio", "outdoor"]),
          perPerson: z.boolean().optional(),
        }),
      )
      .max(10)
      .optional(),
    rooms: z.array(z.string().trim().min(1).max(100)).max(10).optional(),
  })
  .superRefine((r, ctx) => {
    if (r.kind !== "workshop") return;
    if (!r.date || !isIsoDate(r.date)) ctx.addIssue({ code: "custom", path: ["date"], message: "Pick the workshop date" });
    if (!time.safeParse(r.startTime).success) ctx.addIssue({ code: "custom", path: ["startTime"], message: "Start time, e.g. 10:00" });
    if (!time.safeParse(r.endTime).success) ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time, e.g. 13:00" });
    if (r.startTime && r.endTime && r.endTime <= r.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "Must be after the start time" });
    }
  });

export type ResourceInput = z.infer<typeof resourceInputSchema>;
