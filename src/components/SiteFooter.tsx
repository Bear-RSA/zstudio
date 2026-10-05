import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";
import { contact, whatsappUrl } from "@/content/contact";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.2fr_0.7fr_1fr_1.3fr]">
        <div>
          <p className="wordmark text-lg">Z STUDIOS</p>
          <p className="mt-3 font-display text-lg text-rose italic">{contact.tagline}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            A creative space in Woodstock, Cape Town, for artists, filmmakers, performers and businesses bringing
            their ideas to life.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="eyebrow mb-2">Explore</p>
          <Link href="/studio" className="link-underline text-muted">
            The Studio
          </Link>
          <Link href="/equipment" className="link-underline text-muted">
            Equipment rental
          </Link>
          <Link href="/community" className="link-underline text-muted">
            Community &amp; workshops
          </Link>
          <a href={contact.instagram.url} target="_blank" rel="noreferrer" className="link-underline text-muted">
            Instagram {contact.instagram.handle}
          </a>
        </div>
        <address className="flex flex-col gap-2 text-sm not-italic">
          <p className="eyebrow mb-2">Visit &amp; contact</p>
          <a href={contact.mapsUrl} target="_blank" rel="noreferrer" className="link-underline text-muted">
            {contact.address[0]}
            <br />
            {contact.address[1]}
          </a>
          <p className="text-muted">{contact.hours}</p>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="link-underline text-muted">
            WhatsApp {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`} className="link-underline text-muted">
            {contact.email}
          </a>
        </address>
        <div>
          <p className="eyebrow mb-4">Newsletter</p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted sm:px-8">
        © {new Date().getFullYear()} Z Studios. All prices in ZAR. ·{" "}
        <Link href="/credits" className="link-underline">
          Image credits
        </Link>
      </div>
    </footer>
  );
}
