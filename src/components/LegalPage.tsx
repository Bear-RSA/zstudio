import { legal } from "@/content/legal";

/** Shared shell for /privacy and /terms: title, contents list and readable body text. */
export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
  effectiveDate = legal.effectiveDate,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  sections: { id: string; title: string }[];
  effectiveDate?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-8 sm:pt-16">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 font-display text-[clamp(36px,5vw,56px)] leading-none">{title}</h1>
      <p className="mt-4 text-xs text-muted">Effective {effectiveDate}</p>
      <div className="mt-6 text-[15px] leading-relaxed text-muted">{intro}</div>

      <nav aria-label="Contents" className="mt-10 border-y border-line py-6">
        <p className="eyebrow mb-3">Contents</p>
        <ol className="grid list-decimal gap-1.5 pl-5 text-sm sm:grid-cols-2 sm:gap-x-8">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="link-underline text-muted">
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="legal mt-4">{children}</div>
    </div>
  );
}

export function LegalSection({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-line py-8 last:border-b-0">
      <h2 className="font-display text-2xl leading-tight">
        <span className="mr-2 text-rose tabular-nums">{n}.</span>
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted [&_a]:text-bone [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-normal [&_strong]:text-bone [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** CPA s49: terms that limit liability or put risk on the customer must be drawn to their attention. */
export function NoticeBox({ children }: { children: React.ReactNode }) {
  return <div className="border-l-2 border-rose bg-blush px-4 py-3 text-bone">{children}</div>;
}
