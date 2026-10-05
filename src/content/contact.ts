// Public contact details from the client brief (October 2026). Safe to import on the client.

export const contact = {
  tagline: "A space where dreams are nurtured.",
  phone: "065 603 8587",
  /** International format for wa.me and tel: links. */
  phoneIntl: "27656038587",
  email: "zstudiosinfo@gmail.com",
  address: ["145 Sir Lowry Road", "Woodstock, Cape Town, 7915"],
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=145+Sir+Lowry+Road+Woodstock+Cape+Town+7915",
  hours: "Monday – Saturday, 08:00 – 16:30",
  instagram: { handle: "@_thezstudios", url: "https://www.instagram.com/_thezstudios/" },
} as const;

export function whatsappUrl(message = "Hi Z Studios, I'd like to enquire about…") {
  return `https://wa.me/${contact.phoneIntl}?text=${encodeURIComponent(message)}`;
}

/** Services from the brief. Prices to follow from the client — no prices shown until then. */
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

/** The bookable rooms, from Z Studios' own photos. Names are ours until the client confirms theirs. */
export const spaces = [
  {
    title: "Cyclorama studio",
    body: "A white infinity cove with a green-screen bay, for shoots, music videos and content.",
    image: "/studio/cyclorama.jpg",
  },
  {
    title: "Podcast room",
    body: "A treated room with seating for guests, ready to record.",
    image: "/studio/podcast-room.jpg",
  },
  {
    title: "Meeting room",
    body: "For meetings, table reads and planning sessions.",
    image: "/studio/meeting-room.jpg",
  },
] as const;
