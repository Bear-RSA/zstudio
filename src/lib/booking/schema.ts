import { z } from "zod";
import { isIsoDate } from "./dates";

export const MAX_RANGE_DAYS = 31;
// Firestore transactions cap at 500 writes; each line × day is one write.
export const MAX_WRITES = 450;

const isoDate = z.string().refine(isIsoDate, "Invalid date");

export const cartLineSchema = z.object({
  resourceId: z.string().min(1).max(100),
  qty: z.number().int().min(1).max(50),
});

export const customerSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().email("Please enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{9,20}$/, "Please enter a valid phone number"),
  idNumber: z.string().trim().min(6, "Please enter your ID or passport number").max(30),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const enquirySchema = z.object({
  lines: z.array(cartLineSchema).min(1, "Your cart is empty").max(30),
  startDate: isoDate,
  endDate: isoDate,
  customer: customerSchema,
  acceptTerms: z.literal(true, { message: "Please accept the hire terms" }),
  // Honeypot — real users never see or fill this.
  website: z.string().max(0).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type CustomerInput = z.infer<typeof customerSchema>;

export const MAX_WORKSHOP_SEATS = 4;

/** Workshops don't need an ID number: nothing leaves the building. */
export const workshopAttendeeSchema = customerSchema.omit({ idNumber: true, company: true });

export const workshopSignupSchema = z.object({
  workshopId: z.string().min(1).max(100),
  seats: z.number().int().min(1).max(MAX_WORKSHOP_SEATS),
  attendee: workshopAttendeeSchema,
  acceptTerms: z.literal(true, { message: "Please accept the booking terms" }),
  website: z.string().max(0).optional(),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  // Honeypot: checked in the action so bots get a silent "success".
  website: z.string().max(200).optional(),
});

export type WorkshopAttendeeInput = z.infer<typeof workshopAttendeeSchema>;
