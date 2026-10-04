# Z Studios

Public site and booking engine for Z Studios, Cape Town. It covers equipment hire (by the day, quantity-tracked) and studio hire (full days).

**Phase 1 (this build):** browse equipment and the studio, add them to one cart, pick dates on an availability-aware calendar, review the summary, enter personal details and submit an **Enquiry**. Submitting creates a reference number, emails the Resend notifications, and shows a page with the EFT banking details.

**Phase 2:** admin dashboard. **Phase 3:** OZOW payments.

## Run it

```bash
npm install
cp .env.example .env.local   # fill in what you have; everything is optional in dev
npm run dev
```

With no Firebase credentials, dev uses an **in-memory store** seeded from `src/lib/booking/seed-data.ts`. Bookings reset when the server restarts. Production refuses to start without Firebase.

Other options:

| | |
|---|---|
| Real Firestore | Set `FIREBASE_SERVICE_ACCOUNT_JSON`, then run `npm run seed` |
| Emulator | `npx firebase emulators:start --only firestore`, then run with `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` |
| Email | Set `RESEND_API_KEY`. Without it, emails are skipped and logged. |
| Community | Past work/collabs: `src/content/community.ts` (empty → shows an Instagram link). Workshops are `resources` with `kind: "workshop"`, a `date`, and `stock` = seats — same holds, references and EFT flow as hire |
| Newsletter | Sign-ups become Resend contacts (optionally in `RESEND_NEWSLETTER_SEGMENT_ID`); send newsletters from Resend Broadcasts |
| Logo + favicon | Save the logo artwork as `assets/brand-reference/logo.png`, then `npm run logo` (cuts out the circle, writes the favicon, apple icon and header mark) |
| Equipment images | `public/equipment/` — Creative Commons + manufacturer images; sources and licences in `src/lib/images.ts`, credits at `/credits` |
| Photos | Put Z Studios' images in `assets/brand-reference/`, then `npm run assets:upload` (see the naming convention in the script header). Until then, image slots show a branded dark frame, never stock photos. |

## Tests

```bash
npm test               # unit tests + in-memory concurrency test
npm run test:emulator  # also runs the Firestore transaction race test (needs Java)
```

## How availability works

Everything that can be booked is a **resource** (`resources/{id}`), with a `kind` of `equipment` or `studio` and a `stock` count. The studio is just a resource with `stock: 1`.

Firestore can't do an overlap query across two fields, so availability is denormalised **per day**:

```
blockedDates/{resourceId}_{YYYY-MM-DD}
  holds: { [bookingRef]: { qty, status: 'held' | 'confirmed', expiresAt } }
```

- **Units used on a day** = the sum of `qty` for holds that are confirmed, or held and not yet expired.
- **Calendar:** one query per cart (`resourceId in [...]` plus a range on `date`), then any day where an item would exceed stock is disabled.
- **Submit:** one transaction re-reads every resource × day, rejects the enquiry on conflict, then writes the holds and `bookings/{reference}`. Two people racing for the last unit can't both win (see the tests).
- **Holds expire** after `HOLD_HOURS` (48 by default) and stop blocking automatically, because expiry is checked when a booking is read. Phase 2's dashboard flips holds to `confirmed` or releases them.

Key code: `src/lib/booking/` (engine), `src/app/book/actions.ts` (server actions), `src/app/book/*` (flow pages).

## Conventions

- Dates are `YYYY-MM-DD` strings in SA time. Day count is inclusive: collect Mon and return Wed is 3 days.
- Money is whole Rand, displayed as `R1,250` (`formatRand`).
- Prices are always recomputed on the server at submit. The cart's prices are only for display.
- Motion follows a strict set of rules:
  - Custom ease-out curves.
  - Press feedback is `scale(0.97)`.
  - Nothing animates on high-frequency controls (calendar days, steppers, filters).
  - Hover effects are gated to fine pointers.
  - `prefers-reduced-motion` is respected.

## Phase 2 / 3 notes

- **Admin:** `/admin` behind Firebase Auth, with a staff allowlist via custom claims. It lists bookings and offers confirm/release, implemented as a transaction that flips `holds[ref].status` on each `blockedDates` doc plus `bookings/{ref}.status`. It shows an inventory view of "out today" and a month calendar built from `blockedDates`. A Vercel Cron job marks expired holds.
- **OZOW:** after `createEnquiry`, redirect to OZOW with the booking reference as `TransactionReference`. The webhook verifies the hash and confirms the booking. EFT stays as a fallback.
