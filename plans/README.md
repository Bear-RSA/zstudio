# Animation plans

Written by an animation audit against the working tree on top of commit `e219be5` (all app code was
uncommitted at audit time — commit before executing so plans can be checked against a stable base).

Each plan is self-contained: exact files, current-code excerpts, target values, steps, boundaries and a
feel check. Execute them with any agent, one at a time, in the order below.

| # | Plan | Severity | Category | Status |
| --- | --- | --- | --- | --- |
| 001 | [Stop hiding above-the-fold images behind the scroll reveal](001-no-reveal-above-the-fold.md) | HIGH | Purpose & frequency / Performance | TODO |
| 002 | [Make the scroll reveal progressive](002-progressive-reveal.md) | MEDIUM | Physicality / Accessibility | TODO |
| 003 | [Play the equipment grid stagger once per session](003-grid-stagger-once-per-session.md) | MEDIUM | Purpose & frequency | TODO |
| 004 | [Tighten the card hover zoom; drop it under reduced motion](004-card-hover-zoom.md) | LOW | Easing & duration / Accessibility | TODO |
| 005 | [Fade the header's backdrop blur with its tint](005-header-blur-transition.md) | LOW | Cohesion & tokens | TODO |
| 006 | [One-time entrance on the booking confirmation](006-confirmation-entrance.md) | LOW | Missed opportunity | TODO |
| 007 | [Soften the newsletter success swap](007-newsletter-success-crossfade.md) | LOW | Missed opportunity | TODO |
| 008 | [Let the calendar settle in when availability arrives](008-calendar-loading-fade.md) | LOW | Missed opportunity | TODO |

## Recommended order

1. **001** first — highest impact, smallest change.
2. **002** — independent of 001 (001 removes two usages; 002 changes the component and its CSS). Doing 001 first keeps
   002's feel check focused on the intended below-the-fold reveals.
3. **003**, then **006** — both edit the `.stagger` area of `src/app/globals.css` (003 adds a rule after it,
   006 changes its `animation-delay` line). Run them sequentially, not in parallel, to avoid edit conflicts.
4. **004**, **005**, **007**, **008** — independent one-liners, any order.

## Dependencies & conflicts

- 002 and 004 both edit the `@media (prefers-reduced-motion: reduce)` block in `src/app/globals.css` (different
  rules) — sequential execution only.
- 003 and 006 both touch `.stagger` in `src/app/globals.css` — sequential execution only.
- No plan adds a dependency or changes behaviour outside motion.

## Already right (no action)

Custom easing tokens; `scale(0.97)` press feedback on all pressables; hover motion gated to fine pointers;
no `transition: all`, no `scale(0)`, no `ease-in`; calendar days, quantity steppers and filter chips deliberately
un-animated; vaul drawer on the iOS curve; reduced-motion coverage for every animation. The cart badge's 1.25×
`tick` pop was not planned — judge it in slow motion; if it reads as cheap against the cinematic tone, drop the
keyframe peak to `scale(1.15)`.
