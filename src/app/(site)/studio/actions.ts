"use server";

import { z } from "zod";
import { findConflicts } from "@/lib/booking/availability";
import { addDays, isIsoDate, todaySA } from "@/lib/booking/dates";
import { quoteService } from "@/lib/booking/pricing";
import { serviceBookingSchema, spaceBookingSchema } from "@/lib/booking/schema";
import { addMinutes, dayStartTimes, formatDuration, formatTimeRange, isOpenDay, nowTimeSA, SLOT_MINUTES, slotKey, slotKeys, slotsUntilClose } from "@/lib/booking/slots";
import { getStore } from "@/lib/booking/store";
import { submitBooking, type SubmitResult } from "@/lib/booking/submit";
import { PRODUCTION_TEAM_ID, type CartLine, type Resource } from "@/lib/booking/types";

/** How far ahead a space can be booked, matching the equipment calendar. */
const WINDOW_DAYS = 120;

const bookableDate = (date: string) => {
  const today = todaySA();
  return isIsoDate(date) && date >= today && date <= addDays(today, WINDOW_DAYS - 1) && isOpenDay(date);
};

const id = z.string().min(1).max(100);

/** Start times on `date` at which any of `resources` is fully held, or that have already passed. */
async function takenTimes(resources: Resource[], date: string): Promise<string[]> {
  const times = dayStartTimes();
  const keys = times.map((t) => slotKey(date, t));
  const store = await getStore();
  const docs = await store.queryBlockedDates(
    resources.map((r) => r.id),
    keys[0],
    keys[keys.length - 1],
  );
  const lines = resources.map((r) => ({ resourceId: r.id, qty: 1 }));
  const stock = Object.fromEntries(resources.map((r) => [r.id, r.stock]));
  const taken = new Set(findConflicts(lines, keys, stock, docs, Date.now()).map((c) => c.date.slice(11)));
  // Today: nothing that has already started.
  if (date === todaySA()) {
    const now = nowTimeSA();
    for (const t of times) if (t < now) taken.add(t);
  }
  return times.filter((t) => taken.has(t));
}

/** Start times on `date` that are taken or already past. Feeds the space's time grid. */
export async function getUnavailableTimes(resourceId: string, date: string): Promise<string[]> {
  id.parse(resourceId);
  if (!bookableDate(date)) return dayStartTimes();
  const space = (await (await getStore()).getResources([resourceId])).get(resourceId);
  if (!space || space.kind !== "studio") return dayStartTimes();
  return takenTimes([space], date);
}

/**
 * What a service booking holds: the production team, plus the room for an indoor package.
 * Returns an error message when the room isn't one this service can use.
 */
async function serviceHolds(service: Resource, location: "studio" | "outdoor", roomId?: string) {
  const rooms = service.rooms ?? [];
  const room = location === "studio" ? (roomId ?? (rooms.length === 1 ? rooms[0] : undefined)) : undefined;
  if (location === "studio" && (!room || !rooms.includes(room))) return { ok: false, error: "Please pick a room for the shoot." } as const;
  const ids = [PRODUCTION_TEAM_ID, ...(room ? [room] : [])];
  const resources = await (await getStore()).getResources(ids);
  if (resources.size !== ids.length) return { ok: false, error: "This service can't be booked right now. Please contact us." } as const;
  return { ok: true, resources, room: room ? resources.get(room) : undefined } as const;
}

/** Start times on `date` when the team (and, indoors, the room) is taken. Feeds the service's time grid. */
export async function getServiceUnavailableTimes(serviceId: string, location: "studio" | "outdoor", roomId: string | null, date: string) {
  id.parse(serviceId);
  z.enum(["studio", "outdoor"]).parse(location);
  if (roomId !== null) id.parse(roomId);
  if (!bookableDate(date)) return dayStartTimes();
  const service = (await (await getStore()).getResources([serviceId])).get(serviceId);
  if (!service || service.kind !== "service") return dayStartTimes();
  const holds = await serviceHolds(service, location, roomId ?? undefined);
  if (!holds.ok) return dayStartTimes();
  return takenTimes([...holds.resources.values()], date);
}

export async function createSpaceBooking(input: unknown): Promise<SubmitResult> {
  const parsed = spaceBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const { resourceId, date, startTime, slots, customer } = parsed.data;

  const resources = await (await getStore()).getResources([resourceId]);
  const space = resources.get(resourceId);
  if (!space || space.kind !== "studio") return { ok: false, error: "This space is no longer available." };
  if (!bookableDate(date)) return { ok: false, error: "That date can't be booked. We're open Monday to Saturday, except public holidays." };
  if (!dayStartTimes().includes(startTime) || slots > slotsUntilClose(startTime)) {
    return { ok: false, error: "That time is outside our opening hours." };
  }
  if (date === todaySA() && startTime < nowTimeSA()) return { ok: false, error: "That time has already passed." };
  const min = space.minSlots ?? 1;
  if (slots < min) return { ok: false, error: `${space.name} is booked for at least ${formatDuration(min)}.` };

  return submitBooking({
    lines: [{ resourceId, qty: 1 }],
    resources,
    startDate: date,
    endDate: date,
    customer,
    details: `${formatTimeRange(startTime, slots)} · ${formatDuration(slots)}`,
    space: { slots: slotKeys(date, startTime, slots), startTime, endTime: addMinutes(startTime, slots * SLOT_MINUTES) },
  });
}

export async function createServiceBooking(input: unknown): Promise<SubmitResult> {
  const parsed = serviceBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }
  const { serviceId, packageId, roomId, date, startTime, customer } = parsed.data;

  const service = (await (await getStore()).getResources([serviceId])).get(serviceId);
  const pkg = service?.kind === "service" ? service.packages?.find((p) => p.id === packageId) : undefined;
  if (!service || !pkg) return { ok: false, error: "This package is no longer available." };
  const people = pkg.perPerson ? parsed.data.people : 1;
  const slots = pkg.slots * people;

  if (!bookableDate(date)) return { ok: false, error: "That date can't be booked. We're open Monday to Saturday, except public holidays." };
  if (!dayStartTimes().includes(startTime) || slots > slotsUntilClose(startTime)) {
    return { ok: false, error: "That doesn't fit in our opening hours. Try an earlier start." };
  }
  if (date === todaySA() && startTime < nowTimeSA()) return { ok: false, error: "That time has already passed." };

  const holds = await serviceHolds(service, pkg.location, roomId);
  if (!holds.ok) return { ok: false, error: holds.error };
  const lines: CartLine[] = [...holds.resources.keys()].map((resourceId) => ({ resourceId, qty: 1 }));

  return submitBooking({
    lines,
    resources: holds.resources,
    startDate: date,
    endDate: date,
    customer,
    details: [
      `${formatTimeRange(startTime, slots)} · ${formatDuration(slots)}`,
      holds.room ? holds.room.name : "On location",
      pkg.perPerson && `${people} ${people === 1 ? "person" : "people"}`,
    ]
      .filter(Boolean)
      .join(" · "),
    space: { slots: slotKeys(date, startTime, slots), startTime, endTime: addMinutes(startTime, slots * SLOT_MINUTES) },
    service: {
      quote: quoteService(service, pkg, people),
      details: {
        packageId: pkg.id,
        packageLabel: pkg.label,
        location: pkg.location,
        ...(holds.room && { roomId: holds.room.id, roomName: holds.room.name }),
        people,
      },
    },
  });
}
