# 002 — Make the scroll reveal progressive (visible by default, armed only when off-screen)

- **Status**: DONE
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: MEDIUM
- **Category**: Physicality & origin / Accessibility
- **Estimated scope**: 2 files, ~40 lines

## Problem

The reveal is built so content starts **hidden** in the server HTML and relies on JavaScript to show it:

```tsx
// src/components/Reveal.tsx:9,28 — current
  const [revealed, setRevealed] = useState(false);
  ...
    <div ref={ref} data-revealed={revealed} className={cn("reveal", className)}>
```

```css
/* src/app/globals.css:153-159 — current */
  .reveal {
    clip-path: inset(0 0 100% 0);
    transition: clip-path 900ms var(--ease-in-out);
  }
  .reveal[data-revealed="true"] {
    clip-path: inset(0 0 0 0);
  }

/* src/app/globals.css:218-224 — current (inside @media (prefers-reduced-motion: reduce)) */
  .reveal {
    clip-path: none;
    opacity: 0;
    transition: opacity 400ms ease;
  }
  .reveal[data-revealed="true"] {
    opacity: 1;
  }
```

Consequences: anything wrapped in `<Reveal>` that is already on screen at load flashes hidden and then wipes in
(it was never "revealed" by scrolling — the animation explains nothing); with JS disabled or slow, content stays
hidden; the reduced-motion version has the same JS dependency via `opacity: 0`.

## Target

Content is **visible by default** (server HTML and first paint). After mount, the component decides:

- If the element is already within the viewport (its top is above `window.innerHeight - 100`), do nothing — it
  stays visible, no animation.
- Otherwise set `data-armed="true"` (which hides it — it's off-screen, so the user never sees that), observe it,
  and when it intersects (same `rootMargin: "0px 0px -100px 0px"`) set `data-revealed="true"` to wipe it in.

The reveal animation itself is unchanged: `clip-path` from `inset(0 0 100% 0)` to `inset(0 0 0 0)` over
`900ms var(--ease-in-out)` (rare marketing motion — allowed to be slow). The transition is applied only on the
revealed state so arming never animates.

```css
/* target — replaces globals.css:153-159 */
  /* One-time image reveal (rare, marketing — allowed to be slower).
     Visible by default; Reveal.tsx arms it only when it starts off-screen. */
  .reveal[data-armed="true"] {
    clip-path: inset(0 0 100% 0);
  }
  .reveal[data-armed="true"][data-revealed="true"] {
    clip-path: inset(0 0 0 0);
    transition: clip-path 900ms var(--ease-in-out);
  }

/* target — replaces globals.css:218-224, inside the existing @media (prefers-reduced-motion: reduce) block */
  .reveal[data-armed="true"] {
    clip-path: none;
    opacity: 0;
  }
  .reveal[data-armed="true"][data-revealed="true"] {
    opacity: 1;
    transition: opacity 400ms ease;
  }
```

## Repo conventions to follow

- Easing tokens are defined once in `src/app/globals.css:24-26` (`--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`);
  reference the token, never re-type the curve.
- Component style: `"use client"` components in `src/components/`, `cn()` from `@/lib/cn` for class merging.
  Exemplar: `src/components/Reveal.tsx` itself.

## Steps

1. Replace the body of `src/components/Reveal.tsx` with:

   ```tsx
   "use client";

   import { useEffect, useRef, useState } from "react";
   import { cn } from "@/lib/cn";

   /**
    * One-time clip-path reveal when scrolled into view. Content is visible by default
    * (server HTML, no-JS, already-on-screen); only elements that start off-screen are
    * armed and revealed as they scroll in.
    */
   export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
     const ref = useRef<HTMLDivElement>(null);
     const [armed, setArmed] = useState(false);
     const [revealed, setRevealed] = useState(false);

     useEffect(() => {
       const el = ref.current;
       if (!el) return;
       // Already visible at mount: leave it alone — revealing it would explain nothing.
       if (el.getBoundingClientRect().top < window.innerHeight - 100) return;

       setArmed(true);
       const io = new IntersectionObserver(
         ([entry]) => {
           if (entry.isIntersecting) {
             setRevealed(true);
             io.disconnect();
           }
         },
         { rootMargin: "0px 0px -100px 0px" },
       );
       io.observe(el);
       return () => io.disconnect();
     }, []);

     return (
       <div ref={ref} data-armed={armed} data-revealed={revealed} className={cn("reveal", className)}>
         {children}
       </div>
     );
   }
   ```

2. In `src/app/globals.css`, replace the `.reveal` / `.reveal[data-revealed="true"]` rules at lines 152–159
   (inside `@layer components`, including the comment line above) with the first target block.

3. In `src/app/globals.css`, inside the existing `@media (prefers-reduced-motion: reduce)` block, replace the
   `.reveal` / `.reveal[data-revealed="true"]` rules at lines 218–224 with the second target block.

## Boundaries

- Do NOT change the duration (900ms), the curve (`--ease-in-out`), the `rootMargin`, or the clip direction.
- Do NOT touch any page that uses `<Reveal>`; the API (`children`, `className`) is unchanged.
- Do NOT add dependencies.
- If the code at the cited lines differs from the excerpts above, STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint src` exit 0.
- **Feel check**:
  - Load `/` at a tall window (e.g. 1440×1600) so the two home cards are on screen at load: they must appear
    immediately with no wipe.
  - Load `/` at 1280×720 and scroll down: the cards wipe in from the top edge once, and never again on scroll up/down.
  - Disable JavaScript and reload `/`, `/studio`, `/community`: every image is visible.
  - DevTools → Animations panel at 10% speed: the reveal is a single `clip-path` transition (no hide animation
    running when the element is armed off-screen).
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, scroll the home page: cards fade in
    (opacity only), with no wipe.
- **Done when**: no `.reveal` element is ever hidden in server-rendered HTML, and below-the-fold reveals still play once.
