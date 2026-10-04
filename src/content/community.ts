// Z Studios' past work and collaborations, shown on /community.
// Add real projects here (e.g. from @_thezstudios). Put images in public/community/.
// While this list is empty the page shows a link to Instagram instead — never placeholder projects.

export interface Project {
  title: string;
  /** Who it was made with or for, e.g. an artist, brand or photographer. */
  collaborator?: string;
  /** e.g. "Music video", "Podcast", "Campaign shoot". */
  type: string;
  year: number;
  /** /community/… path or Cloudinary public ID. */
  image?: string;
  /** Instagram post, YouTube video, etc. */
  href?: string;
}

export const projects: Project[] = [];

export const INSTAGRAM_URL = "https://www.instagram.com/_thezstudios/";
