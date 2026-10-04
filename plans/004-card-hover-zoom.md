# 004 — Tighten the card image hover zoom and drop it under reduced motion

- **Status**: DONE
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: LOW
- **Category**: Easing & duration / Accessibility
- **Estimated scope**: 1 file, ~6 lines

## Problem

Two issues on the same hover effect (equipment grid cards, home page cards):

```css
/* src/app/globals.css:121-123 — current (inside @media (hover: hover) and (pointer: fine)) */
    .card-hover:hover .card-img {
      transform: scale(1.03);
    }

/* src/app/globals.css:135-137 — current */
  .card-img {
    transition: transform 600ms var(--ease-out);
  }

/* src/app/globals.css:229-233 — current (inside @media (prefers-reduced-motion: reduce)) */
  .card-img,
  .tick {
    transition: none;
    animation: none;
  }
```

1. **Duration**: hover is a tens-of-times-per-session interaction; 600ms is double the 300ms UI budget, so moving
   the pointer across the grid leaves a trail of half-finished zooms.
2. **Reduced motion**: the transition is removed but the `scale(1.03)` still applies, so for reduced-motion users
   the image *jumps* to 103% instantly on hover — worse than either the animated or the static version.

## Target

```css
/* replaces globals.css:135-137 */
  .card-img {
    transition: transform 300ms var(--ease-out);
  }

/* added inside the existing @media (prefers-reduced-motion: reduce) block */
  .card-hover:hover .card-img {
    transform: none;
  }
```

The `--ease-out` token (`cubic-bezier(0.23, 1, 0.32, 1)`) stays; only the duration changes.

## Repo conventions to follow

- Easing tokens in `src/app/globals.css:24-26`; reference `var(--ease-out)`, never re-type the curve.
- Reduced-motion overrides live in the single `@media (prefers-reduced-motion: reduce)` block starting at
  `src/app/globals.css:211`.

## Steps

1. `src/app/globals.css:136`: change `transition: transform 600ms var(--ease-out);` to
   `transition: transform 300ms var(--ease-out);`.
2. In the `@media (prefers-reduced-motion: reduce)` block, after the `.card-img, .tick { … }` rule, add:

   ```css
     .card-hover:hover .card-img {
       transform: none;
     }
   ```

   Leave the existing `.card-img, .tick` rule as is.

## Boundaries

- Do NOT change the scale amount (1.03), the hover media-query gate, or `.tick`.
- Do NOT touch any `.tsx` file.

## Verification

- **Mechanical**: `npx next build` (or the dev server) compiles the CSS without errors.
- **Feel check**:
  - On `/equipment`, sweep the pointer quickly across several cards: each zoom settles in about 300ms; no
    lingering slow zooms.
  - DevTools → Rendering → `prefers-reduced-motion: reduce`: hovering a card does nothing to the image (no jump).
  - On a touch device (or DevTools device mode), tapping a card does not zoom (hover gate unchanged).
- **Done when**: the hover zoom is 300ms and absent entirely under reduced motion.
