"use client";

import { Check } from "lucide-react";
import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/community/actions";
import { cn } from "@/lib/cn";

export function NewsletterForm({ className, compact }: { className?: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-rose", className)} role="status">
        <Check size={14} /> You&rsquo;re on the list. Watch your inbox for workshops and studio news.
      </p>
    );
  }

  return (
    <form
      className={className}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const res = await subscribeNewsletter({ email, website });
          if (res.ok) setDone(true);
          else setError(res.error);
        });
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={compact ? "newsletter-footer" : "newsletter"}>
          Email address
        </label>
        <input
          id={compact ? "newsletter-footer" : "newsletter"}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={cn("field", compact && "py-2.5")}
        />
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />
        <button type="submit" disabled={pending || !email} className={cn("btn-primary shrink-0", compact && "h-11")}>
          {pending ? "Joining…" : "Subscribe"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted">Workshops, open studio days and kit news. Unsubscribe any time.</p>
      )}
    </form>
  );
}
