// Legal details for /privacy and /terms. Safe to import on the client.

export const legal = {
  /** Date the current privacy policy took effect. */
  effectiveDate: "5 October 2026",
  /** Date the current terms took effect (client's Terms & Conditions PDF, October 2026). */
  termsEffectiveDate: "7 October 2026",
  /** Registered name of the business, e.g. "Z Studios (Pty) Ltd". */
  entityName: "Z Studios",
  /** CIPC registration number. Shown only once set. */
  registrationNumber: "2025/073233/07" as string | null,
  /** VAT number. Shown only once set. */
  vatNumber: null as string | null,
  /** POPIA Information Officer. Defaults to the head of the business (POPIA s1, s55). */
  informationOfficer: "the owner of Z Studios",
  informationRegulatorUrl: "https://inforegulator.org.za/",
} as const;

