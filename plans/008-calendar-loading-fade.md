# 008 — Let the calendar settle in when availability arrives

- **Status**: DONE
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: LOW (missed opportunity — additive)
- **Category**: Missed opportunities
- **Estimated scope**: 1 file, 1 line

## Problem

While availability loads, the calendar panel is dimmed; when it arrives it jumps to full opacity in one frame
(and booked days appear struck through at the same instant):

```tsx
// src/app/book/dates/page.tsx:109-113 — current
        <div
          ref={setPanel}
          className={cn("mt-8 border border-line bg-surface p-3 sm:p-6", !unavailable && "opacity-50")}
          aria-busy={!unavailable}
        >
```

A brief opacity transition turns the jump into a settle and makes "this just loaded" readable.

## Target

```tsx
          className={cn(
            "mt-8 border border-line bg-surface p-3 transition-opacity duration-150 ease-[ease] sm:p-6",
            !unavailable && "opacity-50",
          )}
```

150ms `ease`: it's an opacity/colour-style change and it happens once per page visit. Only the panel's own
`opacity` transitions; **day cells stay un-animated** (they're clicked many times — see the comment at
`src/app/globals.css:245`).

## Repo conventions to follow

- Colour/opacity changes use `ease` (exemplar: `src/app/globals.css:83-86`).
- Do not add transitions to `.rdp-*` day elements.

## Steps

1. `src/app/book/dates/page.tsx:111`: replace the `className={cn(…)}` with the target.

## Boundaries

- Do NOT animate day buttons, range highlighting, or month navigation.
- Do NOT change the loading logic or `aria-busy`.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint src` exit 0.
- **Feel check**:
  - With an item in the cart, open `/book/dates` with Network throttled to "Slow 4G": the dimmed calendar
    brightens smoothly in about 150ms when availability arrives.
  - Click dates rapidly: selection colours still change instantly (no transition on days).
- **Done when**: only the panel's opacity is transitioned, at 150ms `ease`.
