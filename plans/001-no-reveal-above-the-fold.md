# 001 — Stop hiding above-the-fold images behind the scroll reveal

- **Status**: DONE
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: HIGH
- **Category**: Purpose & frequency / Performance
- **Estimated scope**: 2 files, ~10 lines

## Problem

`<Reveal>` renders its children with `clip-path: inset(0 0 100% 0)` (fully hidden) until React hydrates and an
IntersectionObserver fires, then wipes them in over **900ms**. It is wrapped around the **main product image** on
every equipment item page — the most-visited page in the shop — and around the studio page hero. Both are
above the fold and marked `priority` (the LCP image). Result: on every product view the main image is blank,
then slowly wipes in; on a slow phone it's blank for longer; with JavaScript disabled it never appears.

```tsx
// src/app/equipment/[slug]/page.tsx:33-45 — current
          {gallery.map((id, i) => (
            <Reveal key={id ?? i}>
              <Media
                src={id}
                alt={`${item.name}${i ? ` — view ${i + 1}` : ""}`}
                priority={i === 0}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="aspect-[4/3]"
                label={item.category.toUpperCase()}
                showCredit
              />
            </Reveal>
          ))}
```

```tsx
// src/app/studio/page.tsx:48-54 — current
        <Reveal className="mt-12">
          {hero ? (
            <Media src={hero} alt="Inside the Z Studios space" priority sizes="100vw" className="aspect-[16/9]" />
          ) : (
            <StudioScene priority className="aspect-[16/9]" />
          )}
        </Reveal>
```

A 900ms reveal is fine for a rarely-seen marketing image below the fold; it is wrong for the primary content of
a page people open tens of times per session.

## Target

- The first (primary) image on the equipment item page renders immediately, with no wrapper animation.
  Secondary gallery images (index ≥ 1, below the fold) may keep `<Reveal>`.
- The studio page hero renders immediately, with no `<Reveal>`.
- Below-the-fold reveals elsewhere (home page cards, studio detail pair, community projects) are unchanged.

## Repo conventions to follow

- `Reveal` lives in `src/components/Reveal.tsx`; it is a wrapper `<div>` — removing it means rendering the child
  directly. Where the wrapper carried a `className` (e.g. `mt-12`), move that class to a plain `<div>`.
- Keep the `key` on the outermost element of the `.map` callback.

## Steps

1. `src/app/equipment/[slug]/page.tsx`: replace the `gallery.map(...)` block with:

   ```tsx
          {gallery.map((id, i) => {
            const media = (
              <Media
                src={id}
                alt={`${item.name}${i ? ` — view ${i + 1}` : ""}`}
                priority={i === 0}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="aspect-[4/3]"
                label={item.category.toUpperCase()}
                showCredit
              />
            );
            // The primary image is the page's main content: show it immediately.
            return i === 0 ? <div key={id ?? i}>{media}</div> : <Reveal key={id ?? i}>{media}</Reveal>;
          })}
   ```

2. `src/app/studio/page.tsx`: replace `<Reveal className="mt-12">` … `</Reveal>` (lines 48–54) with
   `<div className="mt-12">` … `</div>`, keeping the inner `{hero ? … : …}` exactly as is.
   `Reveal` is still used further down in this file (the detail pair) — keep the import.

## Boundaries

- Do NOT edit `src/components/Reveal.tsx` or `src/app/globals.css` (that is plan 002).
- Do NOT touch `src/app/page.tsx` or `src/app/community/page.tsx` — those reveals are below the fold and intended.
- Do NOT change `Media` props, sizes, or `priority`.
- If the code at the cited lines differs from the excerpts above, STOP and report.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint src` both exit 0.
- **Feel check**:
  - Open `/equipment/sony-fx3` with DevTools → Network throttled to "Slow 4G". The main image must appear as soon
    as it loads, with no wipe and no blank clipped box before hydration.
  - Disable JavaScript (DevTools → Settings → Debugger) and reload `/equipment/sony-fx3` and `/studio`: the main
    image / studio hero must be visible.
  - Go grid → item → back → another item several times: the item image never animates.
  - On `/studio`, scroll down: the two detail images still wipe in once (that reveal is intentional).
- **Done when**: no `Reveal` wraps the index-0 gallery image or the studio hero, and both are visible with JS off.
