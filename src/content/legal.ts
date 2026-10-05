// Legal details for /privacy and /terms. Safe to import on the client.
// Confirm the [bracketed] items and the cancellation fees with the client before launch.

export const legal = {
  /** Date the current versions of both documents took effect. */
  effectiveDate: "5 October 2026",
  /** Registered name of the business, e.g. "Z Studios (Pty) Ltd". */
  entityName: "Z Studios",
  /** CIPC registration number. Shown only once set. */
  registrationNumber: null as string | null,
  /** VAT number. Shown only once set. */
  vatNumber: null as string | null,
  /** POPIA Information Officer. Defaults to the head of the business (POPIA s1, s55). */
  informationOfficer: "the owner of Z Studios",
  informationRegulatorUrl: "https://inforegulator.org.za/",
} as const;

/** Cancellation fees for studio and equipment hire, by notice given before the first booked day. */
export const cancellationTiers = [
  { notice: "7 days or more", fee: "No fee, full refund" },
  { notice: "48 hours to 7 days", fee: "50% of the booking total" },
  { notice: "Less than 48 hours, or no-show", fee: "100% of the booking total" },
] as const;
