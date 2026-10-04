# 003 — Play the equipment grid stagger once per session, not on every return

- **Status**: DONE — implemented with one deviation: the grid is marked "seen" when the stagger finishes (onAnimationEnd on the last card), not on unmount. React dev mode runs effect cleanups immediately, which would have cut the stagger off mid-play; marking at the end is also invisible in production.
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: MEDIUM
- **Category**: Purpose & frequency
- **Estimated scope**: 3 files, ~30 lines

## Problem

The equipment grid fades its cards in with a stagger on every mount:

```tsx
// src/app/equipment/EquipmentGrid.tsx:42-43 — current
      {/* Stagger plays on first load only; filtering is instant. */}
      <ul className={cn(!filtered && "stagger", "mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3")}>
```

```css
/* src/app/globals.css:161-165 — current */
  /* First-load stagger for grids. Decorative; never blocks interaction. */
  .stagger > * {
    animation: rise 420ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 40ms);
  }
```

"First load" is actually *every* load. The core browsing loop is grid → item → back → item → back, so the
stagger replays each time the user returns. Each item has `--i` capped at 8, so the last cards finish
8 × 40ms + 420ms ≈ 740ms after arrival. A decorative entrance seen tens of times per session should be
seen once.

## Target

- First visit to `/equipment` in a browser session: stagger plays exactly as today.
- Any later visit in the same session (client-side back/forward, link clicks, or a hard reload): cards render
  immediately, no animation.
- The "seen" state is recorded when the user **leaves** the grid (unmount), so a stagger in progress is never cut off.
- Storage access is wrapped in try/catch (private mode / blocked storage → behaves like first visit, never throws).

Mechanism: a `data-grid-seen` attribute on `<html>` suppresses the stagger via CSS. It is set on grid unmount
(plus `sessionStorage`), and restored before first paint on hard reloads by a tiny inline script.

```css
/* target — add directly after the .stagger rule in globals.css */
  /* Returning to the grid in the same session: no entrance, cards are just there. */
  html[data-grid-seen] .stagger-once > * {
    animation: none;
  }
```

## Repo conventions to follow

- Root layout: `src/app/layout.tsx` (server component; `<html lang="en-ZA" className=...>` at line 35).
- Client components use `"use client"` and hooks from React; class merging via `cn()` from `@/lib/cn`.
- Storage is always wrapped in try/catch (see the cart store's persisted storage in `src/stores/cart.ts`).

## Steps

1. `src/app/globals.css`: add the target CSS block right after the `.stagger > * { … }` rule (after line 165,
   still inside `@layer components`).

2. `src/app/equipment/EquipmentGrid.tsx`:
   - Change the import to `import { useEffect, useMemo, useState } from "react";`
   - Add, right after the `const [filtered, setFiltered] = useState(false);` line:

     ```tsx
       // Mark the grid as seen when the user leaves it, so returning doesn't replay the stagger.
       useEffect(
         () => () => {
           document.documentElement.setAttribute("data-grid-seen", "");
           try {
             sessionStorage.setItem("zs-grid-seen", "1");
           } catch {
             /* storage blocked — the stagger simply replays */
           }
         },
         [],
       );
     ```

   - Change the `<ul>` className to:
     `className={cn(!filtered && "stagger stagger-once", "mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3")}`
   - Update the comment above it to: `{/* Stagger plays once per session; filtering and return visits are instant. */}`

3. `src/app/layout.tsx`:
   - Add `suppressHydrationWarning` to the `<html>` element (the inline script below adds an attribute before
     hydration): `<html lang="en-ZA" className={...} suppressHydrationWarning>`.
   - Add as the first child of `<body>`:

     ```tsx
        {/* Restores "grid already seen this session" before first paint on hard reloads (see EquipmentGrid). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("zs-grid-seen"))document.documentElement.setAttribute("data-grid-seen","")}catch(e){}`,
          }}
        />
     ```

## Boundaries

- Do NOT change the `.stagger` rule, the `rise` keyframes, the 420ms / 40ms values, or `--i` capping.
- Do NOT add `stagger-once` to the home hero (`src/app/page.tsx:34`) — the hero entrance is a rare marketing moment.
- Do NOT add dependencies or a provider.
- If the code at the cited lines differs from the excerpts above, STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint src` exit 0; no hydration warning in the browser console on
  `/equipment` (with and without `zs-grid-seen` in sessionStorage).
- **Feel check**:
  - In a fresh tab, open `/equipment`: cards rise in with the 40ms cascade.
  - Click an item, then browser Back: cards are simply there — no fade, no rise.
  - Hard-reload `/equipment` (Ctrl+R): still no stagger. Open a new tab (new session): the stagger plays again.
  - Open `/equipment` and click an item *during* the stagger: no visual cut-off on the grid (it's being left anyway).
  - DevTools → Application → clear sessionStorage → reload: the stagger plays.
- **Done when**: the stagger plays at most once per tab session, with no console errors or hydration warnings.
