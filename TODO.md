# TODO — the single live backlog

One list, so nothing has to be remembered. Started **2026-08-21** because work has
jumped between the contact form, a pre-launch audit, the page list and a redesign
brief, and the open threads were living in three different places.

- `HANDOFF.md` — background: how things got built, and why. Not a task list.
- `.planning/` — the GSD phase artifacts.
- **This file** — what is still open, and who can do it.

Branch: `claude/trinity-contact-hover-t7xsrf`. Last verified green: lint, 0 type
errors, 186 unit, 324 integration, HTML + JSON-LD audits.

---

## 0. Where we actually left off

| Thread | State |
|---|---|
| **Homepage contact form + date planner** | **Finished and pushed.** Three-step wizard, square tiles at every width, both panels locked to one height, mobile-first. Cal.com dropped; the site owns booking. Nothing outstanding in the component itself. |
| **Pre-launch audit** | **Done.** CSP, security headers, self-hosted fonts, stubs out of the sitemap and noindexed, custom 404. |
| **Page list / sitemap** | **Settled.** 20 routes in `src/lib/constants/routes.ts`. Published: `/`, `/faq`, `/privacyverklaring`, `/algemene-voorwaarden`, `/disclaimer`. The rest are reserved stubs, noindexed and out of the sitemap. |
| **Legal pages + OG image + favicons + Plausible** | **Done and pushed.** |
| **Booking approval + slot blocking** | **Live.** A requested slot greys out at once; she approves or declines from her inbox; approval sends a calendar invite, a decline reopens the slot. Supabase holds only date, time and status — no name, e-mail or klachten. |
| **Homepage redesign** | **Recorded below, not started.** Waiting on an approved layout. |

**Live since 2026-08-24** on `trinitybreathhealing.nl`, with mail wired through Resend. What is left is content, not plumbing.

---

## 1. Ask the aunt — one message, thirteen questions

Every one of these renders as **red bracketed text** on a live page right now.
`npm run audit:placeholders` lists them under "Unfilled `<Todo>` markers".

- [x] KvK number — `97538159`
- [x] Business address — Reigersbos 100 L, 3e etage, 1107 ES Amsterdam
- [x] Phone number — 06 24 24 45 85
- [x] BTW-ID — `NL005276270B90`
- [x] E-mail — she uses `bgrohe72@gmail.com` and wants a business address, so `info@trinitybreathhealing.nl` has to be created and forwarded there
- [ ] Price per session
- [ ] Cancellation window — **provisionally 24 h**, set in `CANCELLATION_HOURS` and already quoted to visitors in the booking e-mails. Confirm or change.
- [ ] Payment method and when it is due
- [ ] Beroepsvereniging — which, and since when
- [ ] Trainings and certifications, with institute and year
- [ ] Her story — 2–3 paragraphs, her own words
- [ ] What a first session is actually like
- [ ] **Confirm the contraindication list on `/disclaimer`** ⚠️
- [ ] **Which calendar does she use — Google or Apple?** Decides §8 step 3.
- [ ] **Heeft ze Facebook, of andere socials?** Right now Instagram is the only real profile, and a single icon reads as an orphan rather than a set — see §9.
- [ ] **Does she still have login access to `trinitybreathandhealing.nl`?** It is
  still registered (checked 2026-08-24), so it did not lapse — but she bought it
  in May 2025 and only access makes it usable as a redirect.

**How she actually works**, supplied 2026-08-24 and now in `BRAND.practice`:
Saturdays at the Reigersbos praktijk, other days she travels to the client, and
several treatments can be given remotely. This is a real constraint, not colour:
`DEFAULT_SCHEDULE` still offers **Mon–Fri 10:00–16:00**. That is probably right
for a 30-minute online kennismaking and wrong for anything else — confirm before
the planner is used for treatments rather than intake calls.

⚠️ The contraindication list is the one item on the site with a safety
consequence. It was written from what is standard for this kind of breathwork,
not from her. Get her eyes on it before launch.

Also outstanding from `HANDOFF.md`: **the treatment images**, which block the
modal image animation.

---

## 2. Publish once §1 comes back

- [ ] Fill the `<Todo>` markers on `/privacyverklaring`, `/algemene-voorwaarden`, `/disclaimer`
- [ ] Fill `/over-mij`, then delete `noindex` in its `+page.ts` and flip its `kind` to `'page'` in `routes.ts`
- [ ] Flip `scripts/grep-placeholders.sh` to exit 1 on any match (the LGL-11 launch gate)

---

## 3. Accounts and DNS — nobody else can do these

- [x] Buy the domain — **bought 2026-08-24**, under Jay's own TransIP account
- [ ] **Invoice the aunt for costs fronted on her behalf** (domain, and anything after it). Keep the receipts as you go rather than reconstructing them later.
- [ ] **Move the domain to her name once the site is finished.** It is already registered with her as registrant; this is the second half — moving it into her own TransIP account, which is a free internal transfer, so she owns the management too and is not dependent on Jay's login.
- [x] **Set the Vercel mail env vars** — done. `RESEND_API_KEY` (Secret), `CONTACT_FROM_EMAIL` = `Trinity Breath & Healing <contact@trinitybreathhealing.nl>`, `CONTACT_TO_EMAIL` = Jay's Gmail.
- [ ] **Repoint `CONTACT_TO_EMAIL` at her inbox** once `info@` forwarding exists. Required, not optional: unset, the code falls back to `BRAND.email`, which has no mailbox — Resend would report success and the submission would vanish.
- [ ] Paste a permanent Google Meet room link for the confirmation e-mail
- [x] Verify the Resend sending domain — DKIM, SPF and MX in TransIP, region `eu-west-1` (Ireland), which is what the privacy statement promises
- [ ] Sign the Resend verwerkersovereenkomst (named in the privacy statement)
- [ ] **Tomorrow.** Google Search Console: add `trinitybreathhealing.nl` as a **new property**, then submit `/sitemap.xml`. Use the **Domain** property type, not URL prefix: it covers `www` and both protocols at once and is verified with a DNS TXT record in TransIP, so nothing has to change in the codebase. The old `google-site-verification` meta tag has been removed. See `Insights/manual-steps.md` §2.
- [ ] Create the Plausible account, then set `PUBLIC_PLAUSIBLE_DOMAIN` in Vercel
- [x] Supabase booking store — project created, migration run, `DATABASE_URL` (transaction pooler, IPv4) and `BOOKING_TOKEN_SECRET` set in Vercel
- [ ] **Sign the Supabase verwerkersovereenkomst** and add Supabase to the processor table in `/privacyverklaring`. Lower stakes than Resend's — the table holds no personal data — but it is still a processor and the statement currently does not name it.
- [ ] **Tomorrow.** Google Business Profile — **must be created from her Google account**, not Jay's: verification goes to the business and transferring ownership afterwards is a genuine hassle. Set it up as a **service-area business** (Amsterdam and surroundings) rather than a storefront. She rents the Reigersbos room one day a week; listing a part-time rented room as a normal storefront is how listings get suspended. Address hidden, or shown with Saturday-only hours.
- [ ] Regenerate the visual-regression baselines on Windows (`npm run test:visual -- --update-snapshots`) — the spec skips on Linux, so CI cannot
- [ ] Check LCP in Search Console a few weeks after launch
- [ ] Decide on PR #13 (`docs/consolidate`), open since 2026-08-10
- [ ] Review or merge PR #14 — this branch already contains all of it

---

## 4. Pages I can build next

- [ ] `/reviews` — needs her reviews first; carries Review + AggregateRating JSON-LD
- [ ] Service page template — **owner is doing this one**, six variants already progressed
- [ ] `/behandelingen`, `/diensten`, `/werkwijze`, `/contact` as real pages
- [ ] `/blog`, `/artikelen` — only worth it once there is something to put in them

---

## 5. Open design decisions

- [ ] **Sitewide colour contrast.** pa11y reports contrast errors on `/`. `--brand-muted` and `--brand-border` were already darkened to pass AA, but the tan CTA pills (nav "Maak een afspraak", the form's "Verstuur email") still fail at roughly 2.1–2.7:1. Fixing them changes the brand look, so it is the owner's call.
- [ ] Homepage redesign — §6.
- [ ] Modal layout and carousel speed — §7.
- [ ] Availability sources — §8.

---

## 6. Homepage redesign brief — recorded 2026-08-21, not started

From another chat. **Do not touch the code until a layout is approved.**

Section order: Hero, Werkwijze, OverMij, Behandelingen, Contact, Faq.

**Problem 1 — two sections compete to be the hero.** Behandelingen runs a
draggable carousel, spring physics, scroll triggers and transitions at once;
Hero has its own observer, scroll, tween and animate work. Everything after them
is comparatively calm, so the eye is fought over twice near the top and then
abandoned. Rule: one loud element per page — loud meaning it fills the view,
moves on its own, carries saturated colour, or demands interaction. Hero keeps
it. Behandelingen gets turned down: keep the carousel, drop the competing
motion, let it be a quiet legible set of treatments.

**Problem 2 — no section rhythm.** Section padding is `--space-5` in one place,
`--space-12` in another, `--space-16` in a third, and the scale stops at 4rem.
The gap between sections is often the same as the gap inside them. Fix: add
`--space-20` (5rem) and `--space-24` (6rem), give every section the same
`padding-block` at that larger scale, and let sections breathe at roughly 3–4×
the rhythm of the elements inside them.

**Problem 3 — motion is per-section instead of systemic.** Define one motion
scale in the token file and have every section use it: 140–160ms for hover and
small state, 180–220ms for enter and exit, 220–260ms
`cubic-bezier(.2,.8,.2,1)` for anything that moves position. Honour
`prefers-reduced-motion` throughout.

**Deliverable:** an artifact showing the redesigned homepage — full section flow
at desktop and mobile width, new spacing rhythm, visibly calmer Behandelingen.

**Constraint:** do not change the palette, the fonts, or the copy. This is a
composition and rhythm problem, not a brand problem.

### Corrections to the brief — check these before acting on it

The diagnosis is sound; three of its specifics are not, and two would send the
work in the wrong direction.

1. **There is no gsap in this project.** It is not a dependency and it is not
   imported anywhere. The only two hits in the repo are comments naming a
   research document. The carousel is hand-rolled physics in
   `Behandelingen.svelte`. Any plan that starts with "remove gsap" has nothing
   to remove.
2. **Behandelingen is 2552 lines, not 1604** — worse than the brief thinks, and
   the largest file in the repo by a factor of four. Hero at 593, OverMij at 532,
   Faq at 337 and Contact at 359 are accurate.
3. **The motion scale already exists.** `--motion-fast` (150ms), `--motion-base`
   (250ms), `--motion-slow` (400ms), `--motion-hover` (180ms), `--ease-out`,
   `--ease-in-out` and `--ease-hover` are all defined in `src/app.css`. The
   problem is adoption, not absence — sections invented their own values next to
   tokens that were already there. That makes Problem 3 a much smaller job than
   it reads: audit and replace, do not design a new scale.

Verified against the spacing claim, which holds: sections do use `--space-16`,
`--space-12` and asymmetric values interchangeably, and the scale does stop at
4rem.


---

## 7. Service modal layout — agreed 2026-08-24, not started

The desktop grid is `1fr auto 1fr` with the image capped at `max-width: 12rem`,
and the modal itself is `92vw × 92vh`. So on a 2560px screen the panel is about
2350×1200 holding 17px type and a 192px image, pinned to the top edge — a thin
stretched band with the height unused. The modal is already full-page; making it
more full-page cannot help. The contents are what do not scale.

Agreed changes:

- Text columns flex, but only within a narrow band — real changes happen at
  breakpoints, not continuously between them.
- The **image column becomes the flexible one**; the `12rem` cap goes.
- Left block hugs the left edge, text left-aligned.
- Right block hugs the **right** edge with its text still **left**-aligned —
  a left-aligned block positioned right, not right-aligned text.
- The image hits a ceiling on wide screens rather than growing forever.
- **Cap the content width inside the full-screen modal** (~1100–1300px, centred).
  This is what stops the horizontal stretch. It leaves dark space either side on
  ultrawide, which is breathing room rather than waste.
- **Raise the type-scale ceiling.** The `clamp()`s in `app.css` top out around a
  1440px viewport, so everything above that is frozen at its maximum — this is
  the "font way too small on big screens" complaint, and fixing it lifts the
  whole site, not just the modal.
- Distribute vertically instead of `align-items: start`.

**Open question:** three columns capped, or two columns (image left at half
width, all text right) at the widest sizes? The two-column version is squarer
and uses height naturally, with no empty flanks. Mock both at 2560px before
deciding.

**Also:** carousel motion down to **×0.5, possibly ×0.25**. Same thread as
"turn Behandelingen down" in §6.

---

## 8. Availability — how slots get blocked

Decided: **the combination**, built in this order, with one rule — her calendar
is a **read-only input**. The site reads busy times from it and never writes
back except approved appointments. Two sources, one direction each; anything
else is a sync loop.

1. [x] **Bookings block slots.** Live.
2. [ ] **Manual slot toggles on the site.** She closes a slot for reasons that
   are not appointments — tired, admin, a buffer between sessions, a week off.
   Needs nothing from her, so it can be built any time.
3. [ ] **Read her calendar.** Needs her account, so it waits for her anyway.
   Google Calendar API `freeBusy` rather than a secret iCal link: the iCal feed
   is cached for hours, and a slot still bookable hours after she blocked it
   causes exactly the rejection this is meant to avoid. `freeBusy` returns busy
   windows only — never event titles or details. If she is on Apple Calendar,
   iCal is the only route and its lag is much smaller.

**Not yet asked:** which calendar she actually uses. That decides step 3.

Also still open on the booking flow itself:

- [x] The visitor now gets an immediate "aanvraag ontvangen" e-mail, which says
  in as many words that it is not a confirmation and that they hear back within
  48 hours. Without it the silence between requesting and hearing back reads as
  a broken form, and people re-submit.
- [ ] A dashboard for her, when volume justifies it. Login can be the same
  signed-link trick as the approval e-mail — she clicks a link in her inbox, no
  password ever, which is better for a non-technical person than a password
  anyway.


---

## 9. Social icons — one profile is not a set

Instagram is the only real profile she has. The footer and the hero used to show
three icons, but two of them linked to `x.com/trinitybnh` and
`facebook.com/trinitybnh` — accounts that do not exist. `BRAND.socials` had
recorded both as `null` the whole time; the markup simply did not read it. Those
two are now removed, which is correct, and leaves a single icon sitting where a
row used to be.

A lone icon reads as something that lost its siblings. Options, roughly in order
of how little they assume:

1. **Ask her first.** If she has a Facebook page — likely, for this audience —
   the row comes back and there is nothing to design around. This is the cheapest
   answer and it is already in §1.
2. **Make it a labelled link rather than an icon.** "Volg mee op Instagram" as
   text sits comfortably alone in a way a bare glyph does not.
3. **Fold it into the contact block**, next to the e-mail and phone, so it is one
   of several ways to reach her rather than a stranded navigation row.

Part of the redesign in §6 either way: it is a composition problem, not a missing
feature. Do not re-add a Facebook or X icon unless the account actually exists —
a link to a dead profile is worse than no link, and it was already shipping once.
