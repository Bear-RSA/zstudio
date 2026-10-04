import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1.4fr]">
        <div>
          <p className="wordmark text-lg">Z STUDIOS</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            A filmmaking hub in Cape Town. Equipment hire and a blacked-out studio for the work you care about.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="eyebrow mb-2">Explore</p>
          <Link href="/equipment" className="link-underline text-muted">
            Equipment
          </Link>
          <Link href="/studio" className="link-underline text-muted">
            The Studio
          </Link>
          <Link href="/community" className="link-underline text-muted">
            Community &amp; workshops
          </Link>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <p className="eyebrow mb-2">Follow</p>
          <a
            href="https://www.instagram.com/_thezstudios/"
            target="_blank"
            rel="noreferrer"
            className="link-underline text-muted"
          >
            Instagram — @_thezstudios
          </a>
          <p className="text-muted">Cape Town, South Africa</p>
        </div>
        <div>
          <p className="eyebrow mb-4">Newsletter</p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted/70 sm:px-8">
        © {new Date().getFullYear()} Z Studios. All prices in ZAR. ·{" "}
        <Link href="/credits" className="link-underline">
          Image credits
        </Link>
      </div>
    </footer>
  );
}
