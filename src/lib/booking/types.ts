export type ResourceKind = "equipment" | "studio" | "workshop";

export interface Resource {
  id: string;
  kind: ResourceKind;
  slug: string;
  name: string;
  category: string;
  description: string;
  specs: string[];
  /** Whole Rand per day. */
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
  createdAt: number;
  expiresAt: number;
  /** Set by the admin dashboard. */
  confirmedAt?: number;
  releasedAt?: number;
  handledBy?: string;
}

export function blockedDateId(resourceId: string, date: string): string {
  return `${resourceId}_${date}`;
}
