// Public contact details from the client brief (October 2026). Safe to import on the client.

export const contact = {
  tagline: "A space where dreams are nurtured.",
  phone: "065 603 8587",
  /** International format for wa.me and tel: links. */
  phoneIntl: "27656038587",
  email: "zstudiosinfo@gmail.com",
  address: ["145 Sir Lowry Road", "Woodstock, Cape Town, 7915"],
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=145+Sir+Lowry+Road+Woodstock+Cape+Town+7915",
  hours: "Monday – Saturday, 08:00 – 17:00 (closed on public holidays)",
  instagram: { handle: "@_thezstudios", url: "https://www.instagram.com/_thezstudios/" },
} as const;

export function whatsappUrl(message = "Hi Z Studios, I'd like to enquire about…") {
  return `https://wa.me/${contact.phoneIntl}?text=${encodeURIComponent(message)}`;
}

/** Services from the brief. Studio prices are on the spaces and in content/studio.ts. */
export const services = [
  { title: "Podcast studio", body: "Studio hire and full podcast production." },
  { title: "Photography studio", body: "Studio hire for shoots of every kind." },
  { title: "Headshots & portraits", body: "Sessions for actors, artists and professionals." },
  { title: "Music videos", body: "Production from concept to final cut." },
  { title: "Video & content", body: "Video production and brand and social media content." },
  { title: "Equipment rental", body: "Cameras, lighting, audio and grip by the day." },
  { title: "Self-tapes & auditions", body: "Recorded properly, ready to send to your agent." },
  { title: "Meeting room", body: "Conference and meeting room hire." },
  { title: "Workshops & masterclasses", body: "Learn from working creatives." },
  { title: "Rehearsal space", body: "Room to rehearse and develop new work." },
] as const;
