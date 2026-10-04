# 007 — Soften the newsletter form → success swap

- **Status**: TODO
- **Commit**: e219be5 (working tree — all app code is uncommitted on top of this commit)
- **Severity**: LOW (missed opportunity — additive)
- **Category**: Missed opportunities
- **Estimated scope**: 1 file, 1 line

## Problem

On a successful subscribe, the whole form is replaced by a one-line message in a single frame:

```tsx
// src/components/NewsletterForm.tsx:15-21 — current
  if (done) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-rose", className)} role="status">
        <Check size={14} /> You&rsquo;re on the list. Watch your inbox for workshops and studio news.
      </p>
    );
  }
```

The swap is abrupt: the input and button vanish and text pops in. The rest of the site's state changes on
buttons use a short opacity + 2px blur crossfade (`.morph`, `src/app/globals.css:177-188`); this one should
match.

## Target

The success line enters with opacity `0 → 1` and `filter: blur(2px) → none` over **200ms**, using
`@starting-style` via Tailwind v4's `starting:` variant. There's no movement, so nothing is needed for reduced motion
(opacity/blur aid comprehension and are kept). Browsers without `@starting-style` show it instantly, which is
today's behaviour.

```tsx
      <p
        className={cn(
          "flex items-center gap-2 text-sm text-rose transition-[opacity,filter] duration-200 ease-[ease] starting:opacity-0 starting:blur-[2px]",
          className,
        )}
        role="status"
      >
```

Easing is `ease` (an appearance crossfade, matching `.morph`'s `opacity 200ms ease, filter 200ms ease`).

## Repo conventions to follow

- Crossfade exemplar: `.morph` in `src/app/globals.css:177-188` (200ms, `ease` for opacity/filter, 2px blur).
- Classes merged with `cn()` from `@/lib/cn`.

## Steps

1. `src/components/NewsletterForm.tsx:17`: replace the `<p …>` opening tag with the target above. Keep its
   children and `role="status"` unchanged.

## Boundaries

- Do NOT animate the form out (it unmounts; exit animation is out of scope).
- Do NOT add translate/scale (keeps this reduced-motion-safe without extra rules).
- Do NOT touch the subscribe logic.

## Verification

- **Mechanical**: `npx tsc --noEmit` and `npx eslint src` exit 0. Confirm Tailwind emitted the
  `@starting-style` rule (DevTools → Elements → Styles on the `<p>` shows a `@starting-style` block).
- **Feel check**:
  - Subscribe on `/community` (works without `RESEND_API_KEY` — it logs instead): the confirmation line fades
    up out of a slight blur in about 200ms, with no pop.
  - Animations panel at 10%: one opacity + filter transition, no movement.
  - Try the footer form too (`compact` variant): same behaviour.
- **Done when**: the success message crossfades in; the form's behaviour is otherwise unchanged.
