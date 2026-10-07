// From the client's brochure (October 2026). Spaces, production services and their prices live
// in the inventory (seed-data.ts / admin); these are the house rules and the in-house kit.

export const bookingConditions = [
  { title: "Deposit", body: "A 50% non-refundable deposit secures your booking." },
  { title: "Turnaround", body: "3 – 5 working days (72 hours) for edited content." },
  { title: "Storage", body: "We keep your content for 2 months at most." },
  { title: "Refunds", body: "A reshoot, or a refund less a 20% deduction." },
] as const;

/** The in-house kit the studio runs on. */
export const studioKit = [
  "Godox Knowled 300W RGB COB light",
  "Godox Knowled MG1200Bi bi-colour LED light",
  "Softboxes",
  "2 × Aputure Amaran 200x S LED lights",
  "2 × C-stands",
  "2 × studio boxes",
  "Backdrops: blue, orange, black, grey, white",
  "RØDE podcasting equipment",
  "4 wireless microphones + 2 extra microphones",
  "Video mixer and sound mixer",
  "USB PodMic and more",
] as const;
