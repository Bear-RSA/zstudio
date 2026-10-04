# 005 — Fade the header's backdrop blur with its tint

- **Status**: TODO
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: LOW
- **Category**: Cohesion & tokens
- **Estimated scope**: 1 file, 1 line

## Problem

When the page scrolls past 8px, the sticky header gains a tinted background and a backdrop blur:

```tsx
// src/components/SiteHeader.tsx:42-46 — current
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300",
          scrolled ? "border-line bg-ink/85 backdrop-blur-md" : "border-transparent bg-transparent",
        )}
      >
```

Only `background-color` and `border-color` are transitioned (300ms, Tailwind's default curve). `backdrop-filter`
is not, so the blur **snaps on** instantly while the tint fades — on the photo-heavy hero you see the image behind
the header go blurry a beat before the tint arrives. The 300ms with an unspecified curve also doesn't match the
repo's colour-change convention (200ms `ease`, see `.btn` in `globals.css:81-86`).

## Target

All three properties transition together, as a colour-style change: 200ms `ease`.

```tsx
          "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-200 ease-[ease]",
```

## Repo conventions to follow

- Colour/background changes use `200ms ease` (exemplar: `src/app/globals.css:83-86`,
  `background-color 200ms ease, border-color 200ms ease, color 200ms ease`).
- Tailwind v4 arbitrary values: `transition-[…]`, `ease-[ease]`.

## Steps

1. `src/components/SiteHeader.tsx:44`: replace
   `"sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300",`
   with
   `"sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-200 ease-[ease]",`

## Boundaries

- Do NOT change the scroll threshold, the colours, or `backdrop-blur-md`.
- Do NOT add a scroll-linked animation.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint src` exit 0.
- **Feel check**:
  - On `/`, scroll slowly past the top: tint and blur arrive together; scroll back up: they leave together.
  - DevTools → Animations panel at 10%: one 200ms transition covering background, border and backdrop-filter.
  - Check in Safari as well as Chrome: if Safari does not interpolate `backdrop-filter` from `none`, the blur will
    still snap there — acceptable, report it rather than adding workarounds.
- **Done when**: in Chrome, the blur fades in and out in step with the tint.
