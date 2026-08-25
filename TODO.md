# TODO — the single live backlog

One list, so nothing has to be remembered. Started **2026-08-21** because work has
jumped between the contact form, a pre-launch audit, the page list and a redesign
brief, and the open threads were living in three different places.

- `HANDOFF.md` — background: how things got built, and why. Not a task list.
- `.planning/` — the GSD phase artifacts.
- **This file** — what is still open, and who can do it.

Branch: `claude/trinity-contact-hover-t7xsrf`. Last verified green: lint, 0 type
errors, 171 unit, 324 integration, HTML + JSON-LD audits.

---

## 0. Where we actually left off

| Thread | State |
|---|---|
| **Homepage contact form + date planner** | **Finished and pushed.** Three-step wizard, square tiles at every width, both panels locked to one height, mobile-first. Cal.com dropped; the site owns booking. Nothing outstanding in the component itself. |
| **Pre-launch audit** | **Done.** CSP, security headers, self-hosted fonts, stubs out of the sitemap and noindexed, custom 404. |
| **Page list / sitemap** | **Settled.** 20 routes in `src/lib/constants/routes.ts`. Published: `/`, `/faq`, `/privacyverklaring`, `/algemene-voorwaarden`, `/disclaimer`. The rest are reserved stubs, noindexed and out of the sitemap. |
| **Legal pages + OG image + favicons + Plausible** | **Done and pushed.** |
| **Homepage redesign** | **Recorded below, not started.** Waiting on an approved layout. |

The two things blocking a live site are both in §3: the mail env vars and a domain.

---

## 1. Ask the aunt — one message, thirteen questions

Every one of these renders as **red bracketed text** on a live page right now.
`npm run audit:placeholders` lists them under "Unfilled `<Todo>` markers".

- [ ] KvK number
- [ ] Business address + city
- [ ] Phone number (also clears `TODO_PHONE` in `brand.ts`, which blocks the launch gate)
- [ ] Price per session
- [ ] Cancellation window — 24 hours?
- [ ] Payment method and when it is due
- [ ] BTW-plichtig: yes or no
- [ ] Beroepsvereniging — which, and since when
- [ ] Trainings and certifications, with institute and year
- [ ] Her story — 2–3 paragraphs, her own words
- [ ] What a first session is actually like
- [ ] Which e-mail provider hosts the inbox
- [ ] **Confirm the contraindication list on `/disclaimer`** ⚠️

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
- [ ] **Set the Vercel mail env vars**: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, optionally `CONTACT_TO_EMAIL` — *both forms are dead without these*
- [ ] Paste a permanent Google Meet room link for the confirmation e-mail
- [ ] Verify the Resend sending domain (EU region)
- [ ] Sign the Resend verwerkersovereenkomst (named in the privacy statement)
- [ ] Google Search Console: add `trinitybreathhealing.nl` as a **new property**, then submit `/sitemap.xml`. It will issue a **new verification token** — the one in `src/app.html` belongs to the old vercel.app property and will not verify the real domain. Send me the token and I will swap it in. See `Insights/manual-steps.md` §2.
- [ ] Create the Plausible account, then set `PUBLIC_PLAUSIBLE_DOMAIN` in Vercel
- [ ] Google Business Profile
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
