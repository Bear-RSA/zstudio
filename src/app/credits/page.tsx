import type { Metadata } from "next";
import { imageMeta } from "@/lib/images";

export const metadata: Metadata = { title: "Image credits" };

export default function CreditsPage() {
  const entries = Object.entries(imageMeta).filter(([, m]) => m.credit);
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10 sm:px-8 sm:pt-16">
      <p className="eyebrow">Image credits</p>
      <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] leading-none">Credits</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">
        Some equipment images are Creative Commons photographs or manufacturers&rsquo; product images, used to show the
        exact model available for hire.
      </p>
      <ul className="mt-8 border-t border-line">
        {entries.map(([src, m]) => (
          <li key={src} className="flex justify-between gap-4 border-b border-line py-3 text-sm">
            <span className="text-muted">{src.split("/").pop()}</span>
            <a href={m.credit!.href} target="_blank" rel="noreferrer" className="link-underline text-right">
              {m.credit!.text}
              {m.credit!.license ? `, ${m.credit!.license}` : " (manufacturer)"}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
