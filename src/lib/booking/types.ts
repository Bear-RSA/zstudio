import { expandRange } from "./dates";

/**
 * `studio`: the bookable spaces (podcast studio, boardroom…), booked by the half hour.
 * `service`: production services (music videos, photoshoots…), booked as fixed packages. They hold
 * the production team (PRODUCTION_TEAM_ID, itself a service with no packages) and, indoors, a room.
 */
export type ResourceKind = "equipment" | "studio" | "workshop" | "service";

/** The resource every production service holds, so the team is never double-booked. stock = crews. */
export const PRODUCTION_TEAM_ID = "production-team";

/** A fixed production package: a set length at a set price. */
export interface ServicePackage {
  id: string;
  label: string;
  /** Length in 30-minute slots. */
  slots: number;
  /** Whole Rand, per booking (or per person when perPerson). */
  price: number;
  /** In one of the service's rooms, or on location (holds only the team). */
  location: "studio" | "outdoor";
  /** Priced and timed per person (headshots): 3 people = 3 × the slots and price. */
  perPerson?: boolean;
}

export interface Resource {
  id: string;
  kind: ResourceKind;
  slug: string;
  name: string;
  category: string;
  description: string;
  specs: string[];
  /** Whole Rand: per day (equipment), per seat (workshops), per 30 minutes (studio spaces). */
  dailyRate: number;
  stock: number;
  /** Local paths (/equipment/…) or Cloudinary public IDs. */
  images: string[];
  active: boolean;
  sortOrder: number;
  /** Workshops only: the single day it runs ('YYYY-MM-DD'), times, and host. stock = seats. */
  date?: string;
  startTime?: string;
  endTime?: string;
  host?: string;
  /** Studio spaces only: the shortest booking, in 30-minute slots (default 1). */
  minSlots?: number;
  /** Services only: what can be booked. dailyRate mirrors the cheapest package ("from" price). */
  packages?: ServicePackage[];
  /** Services only: ids of the studio spaces an indoor package can use (the customer picks if several). */
  rooms?: string[];
}

export type HoldStatus = "held" | "confirmed";

export interface Hold {
  qty: number;
  status: HoldStatus;
  /** Epoch ms; null for confirmed holds. */
  expiresAt: number | null;
}

/** blockedDates/{resourceId}_{YYYY-MM-DD} */
export interface BlockedDate {
  resourceId: string;
  date: string;
  holds: Record<string, Hold>;
}

export type BookingStatus = "held" | "confirmed" | "released" | "expired";

export interface CartLine {
  resourceId: string;
  qty: number;
}

export interface QuoteLine {
  resourceId: string;
  kind: ResourceKind;
  name: string;
  qty: number;
  dailyRate: number;
  lineTotal: number;
}

export interface Quote {
  lines: QuoteLine[];
  days: number;
  total: number;
}

export interface Customer {
  fullName: string;
  email: string;
  phone: string;
  /** Required for equipment/studio hire (liability); not collected for workshops. */
  idNumber?: string;
  company?: string;
  notes?: string;
}

export interface Booking {
  reference: string;
  status: BookingStatus;
  items: QuoteLine[];
  startDate: string;
  endDate: string;
  days: number;
  total: number;
  customer: Customer;
  /** Extra line shown in emails and on the confirmation page, e.g. workshop times. */
  details?: string;
  /**
   * Studio space bookings only: the 30-minute slots held ('YYYY-MM-DDTHH:MM'), all on startDate.
   * Absent for day bookings, which hold every date from startDate to endDate.
   */
  slots?: string[];
  /** Studio space and service bookings: 'HH:MM'. */
  startTime?: string;
  endTime?: string;
  /**
   * What the booking holds, when that differs from `items` (production services: the team and a
   * room, while `items` is the priced service). Absent = each item holds its own qty.
   */
  holds?: CartLine[];
  /** Production service bookings: the detail staff need on the dashboard. */
  service?: {
    packageId: string;
    packageLabel: string;
    location: "studio" | "outdoor";
    roomId?: string;
    roomName?: string;
    people: number;
  };
  createdAt: number;
  expiresAt: number;
  /** Set by the admin dashboard. */
  confirmedAt?: number;
  releasedAt?: number;
  handledBy?: string;
}

/** The resources and quantities a booking holds. */
export function holdLines(b: Pick<Booking, "holds" | "items">): CartLine[] {
  return b.holds ?? b.items.map((i) => ({ resourceId: i.resourceId, qty: i.qty }));
}

/** The blockedDates keys a booking holds: its slots, or its days. */
export function holdUnits(b: Pick<Booking, "slots" | "startDate" | "endDate">): string[] {
  return b.slots?.length ? b.slots : expandRange(b.startDate, b.endDate);
}

export function blockedDateId(resourceId: string, date: string): string {
  return `${resourceId}_${date}`;
}
