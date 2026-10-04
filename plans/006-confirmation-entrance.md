# 006 — Give the booking confirmation a one-time entrance

- **Status**: TODO
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: LOW (missed opportunity — additive)
- **Category**: Missed opportunities
- **Estimated scope**: 2 files, ~15 lines

## Problem

The confirmation page is the rarest, most emotional moment in the product: the customer has just booked gear,
the studio, or a workshop seat. It currently appears with no motion at all: heading, reference and banking
details are just *there*, the same as any form page. Rare moments are allowed the delight budget.

```tsx
// src/app/book/confirmation/[ref]/page.tsx:37-61 — current (abridged)
    <div className="mx-auto max-w-2xl">
      {/* A workshop sign-up never touched the gear cart, so leave it alone. */}
      {!isWorkshop && <ClearCart />}
      <p className="eyebrow text-rose!">…</p>
      <h1 className="mt-3 font-display …">…</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted">…</p>

      <div className="mt-10 border border-rose p-6 sm:p-8">…reference card…</div>

      <section className="mt-10">…banking details…</section>
      <section className="mt-10">…proof of payment…</section>
      <section className="mt-10 border-t border-line pt-6">…booking…</section>
    </div>
```

## Target

A one-time staggered rise using the repo's existing `.stagger` utility (`rise` keyframes: from `opacity: 0;
transform: translateY(8px)`, `420ms var(--ease-out)`, `both`), but with **60ms** steps instead of the default
40ms. Order: eyebrow (0) → heading (1) → intro (2) → reference card (3) → banking (4) → proof (5) → booking (6).
Total ≈ 6 × 60 + 420 = 780ms. This is a page load, not an interaction, so it plays once and never blocks input.

The stagger step becomes configurable with a fallback, so existing users of `.stagger` keep 40ms:

```css
/* target — replaces globals.css:162-165 */
  .stagger > * {
    animation: rise 420ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * var(--stagger-step, 40ms));
  }
```

Reduced motion is already handled: `.stagger > * { animation-name: fade; }` (opacity only) in the existing
`@media (prefers-reduced-motion: reduce)` block.

## Repo conventions to follow

- Stagger exemplar: the home hero, `src/app/page.tsx:34-49`: `className="stagger …"` on the container and
  `style={{ ["--i" as string]: 1 }}` on each child.
- `ClearCart` renders `null` (no DOM element), so it does not take a stagger slot.

## Steps

1. `src/app/globals.css:164`: change `animation-delay: calc(var(--i, 0) * 40ms);` to
   `animation-delay: calc(var(--i, 0) * var(--stagger-step, 40ms));`.
2. `src/app/book/confirmation/[ref]/page.tsx`:
   - Root `<div className="mx-auto max-w-2xl">` → `<div className="stagger mx-auto max-w-2xl [--stagger-step:60ms]">`.
   - Add `style={{ ["--i" as string]: N }}` to each direct child element, in order:
     eyebrow `<p>` → 0 (may be omitted, `--i` defaults to 0), `<h1>` → 1, intro `<p>` → 2, reference card `<div>` → 3,
     banking `<section>` → 4, proof-of-payment `<section>` → 5, booking `<section>` → 6.

## Boundaries

- Do NOT change the `rise` keyframes, the 420ms duration, or the easing.
- Do NOT add motion to the Copy button or any content inside the card (it already has its own `.morph` feedback).
- Do NOT touch other pages using `.stagger` beyond the backwards-compatible CSS change in step 1.
- If the page structure differs from the excerpt (different direct children), STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint src` exit 0.
- **Feel check**:
  - Complete a booking (or open an existing `/book/confirmation/<ref>`): blocks rise in top to bottom, the
    reference card landing about a quarter-second after the heading.
  - DevTools → Animations at 10%: delays step 0, 60, 120 … 360ms; each block moves exactly 8px.
  - The Copy button is clickable immediately (try it during the entrance).
  - Home hero (`/`) still uses 40ms steps, unchanged.
  - `prefers-reduced-motion: reduce`: blocks fade in only, with no vertical movement.
- **Done when**: the confirmation page has a single, once-per-load staggered entrance and nothing else changed.
