# Phase 0 Discussion Log

**Phase:** 0 — Foundation & SEO Scaffolding
**Date:** 2026-06-15
**Driver:** process-interviewer skill (per project feedback memory)

## Round 1 — Hard blockers (workflow + business identity)

### Q1: Practice mode (physical / online / hybrid)

**Asked:** How does the aunt deliver sessions?

**User answer:** "The booking form is for Google Meet only. It is to book a meeting with my aunt to talk about their experience and what might help. From there, they can book an appointment with my aunt with any service they agreed upon."

**Captured:** Booking form = 30-min Google Meet intake/discovery call. Real treatment booked after that call separately.

### Q2: Session delivery location post-intake

**Asked:** After the intake call, where do actual sessions take place?

**User answer:** "They are all physical, and my aunt comes to the client's house. There is no practice room."

**Then revised (Q3 answer):** Reigersbos fysio on Saturdays + own room in Almere also serve as locations. So fully hybrid: mobile at-home + 2 fixed locations + remote energetic.

### Q3: Service area

**Asked:** Where does the aunt travel for sessions?

**User answer:** "Kan bij klanten thuiskomen in de omgeving (30 min rijden vanuit amsterdam dus zaandam, almere, weesp oostzaan, hoofddorp, badhoevedorp) de energische doet ze op afstand dat zijn de mahatma en goldhealing en rasterhealing. daarnaast op zaterdag bij de fysio in reigersbos en heeft ze een ruimte in almere"

**Captured:**
- Mobile in-person: Zaandam, Almere, Weesp, Oostzaan, Hoofddorp, Badhoevedorp (30 min from Amsterdam)
- Fixed in-person: Reigersbos fysio (Saturdays), Almere room
- Remote energetic: Mahatma Healing, Goldhealing, Raster Healing (later corrected by design: "Raster Energie")

**Implication:** Schema choice = `ProfessionalService` + `Service` per modality + `Person` for practitioner. NOT `LocalBusiness` (no storefront).

### Q4: v1 service scope on landing

**Asked:** Which services should v1 landing surface?

**User answer:** "All services briefly (Recommended)"

**Captured:** v1 mentions all named services briefly. Full per-modality content = v2 spoke pages.

### Q5: NAP + identity bundle (freeform)

**Asked:** Fill business name, practitioner name, phone, email, domain, KvK, BTW, addresses, social handles.

**User answer:** "Use Place Holder for now. Write an empty file saying everything that still needs to be filled in so I dont forget."

**Action:** Created `.planning/phases/00-foundation-seo-scaffolding/UNKNOWNS.md` with full unknowns inventory. Phase 0 ships with placeholder constants.

### Q5b: User pushback — designs already contained content

**User answer:** "Have you taken a look at the Hero content, because in my designs I already have content placed? It is one thing to tell me that certain information is necessary for a good SEO/ALLOW, but it is another thing just to completely disregard what I place for content and tell me I have to place this content in without even telling me what it is for, because I already placed content in my designs."

**Acknowledged:** Failure to check Figma frames before requesting content. Read all 11 frames (6 desktop + 5 mobile + menu).

**Facts unlocked from designs:**
- Brand: TRINITY Breath & Healing
- Address: Stationsstraat 45 A, 1315 KS Almere
- Email: info@trinitybnh.nl
- Domain (implied): trinitybnh.nl
- All hero/werkwijze/about/contact/footer copy locked verbatim
- Services list: Mahatma Healing, Goldhealing, Raster Energie, Spinal Touch, "Meer diensten"
- Stats locked: 8+ jaren, 65+ klachten verholpen, ∞ mogelijkheden
- Practitioner age: 53 (from about-me body)
- Site nav: Home · Werkwijze · Over mij · Behandelingen · Contact
- Footer columns: DIENSTEN · MENU · LEZEN

**Updated UNKNOWNS.md** to reflect what designs unlocked vs what still needs aunt input.

## Round 2 — Architectural decisions

### Build approach

**User direction:** "mobile first, then css so it is styled as designed"

**Captured:** Mobile-first markup + structure first; CSS layered to match Figma desktop after. Applies to every Phase 1 section.

### Landing content overrides

**User direction:** "Add faq under form section (Desktop frame 5), no reviews, change the names. regarding the Eyebrow Tags, That's not how they're supposed to be. They're supposed to be the same names used in the navigation."

**Captured:**
- ADD inline FAQ section beneath contact/form section (overrides Figma which lacks FAQ)
- NO reviews on landing
- DROP `/reviews` route entirely
- Eyebrow tags = nav-bar names:
  - Frame 4 (service selector) eyebrow → "Behandelingen" (was "Werkwijze")
  - Frame 5 (contact) eyebrow → "Contact" (was "Over mij")

### Footer additions

**User direction:** "Where the address, the phone number, and the email address have been placed in the design, there should also be the KVK, by the way, and B.I.G. status."

**Captured:** Footer gets KvK + BIG placeholder slots added beneath phone/email/address. Stays as placeholders for now.

### Hosting & infra

**User direction:** "I just want to host on Vercel for the moment."

**Captured:** Vercel (NOT Cloudflare Pages). Swap adapter `@astrojs/cloudflare` → `@astrojs/vercel`. Use Vercel Functions for `/api/contact`. Region `fra1` (Frankfurt) for EU residency.

### Domain

**User direction:** "Trinity BNH is a fine name, but we're not using the name right now."

**Captured:** Don't register custom domain in Phase 0. Use Vercel-default `*.vercel.app`. Connect `trinitybnh.nl` later.

### Search Console

**User direction:** "Search Console account, that's mine."

**Captured:** Verification via user's Google account. Use HTML-file verification method (URL-prefix property) against `*.vercel.app` for now; DNS-TXT switch when custom domain is connected.

### Training crawler

**Explained:** Search/RAG crawlers vs training crawlers (Google-Extended, Applebot-Extended). Trade-off.

**User answer:** "Allow (Recommended)"

**Captured:** robots.txt allows both training crawlers for max long-term AI citation surface.

### Design tokens

**User direction:** "Design tokens: I will provide when we get to that point."

**Captured:** Phase 0 ships placeholder CSS variables marked `/* TODO: replace with Figma values */`. User provides exact tokens later.

### CI provider

**User direction:** "GitHub Actions, since it's connected to GitHub, and I use GitHub, not Cloudflare."

**Captured:** GitHub Actions for tests + Lighthouse CI + pa11y + JSON-LD validation. Vercel handles the deploy half via GitHub integration.

### Repository

**User direction:** "GitHub remote, of course"

Asked follow-up via AskUserQuestion.

**User answer:** Private + `trinity-breath-healing` name.

**Captured:** `github.com/<user>/trinity-breath-healing` (private). Main branch protected.

### Staging URL

**Explained:** Vercel preview vs production URL pattern. No extra decision needed — `main` = `*.vercel.app` until custom domain connects.

## Round 3 — Deferred items (NOT blocking Phase 0)

User declined to provide right now (placeholders OK):
- Real phone number
- KvK / BTW
- BIG status
- Professional association memberships

Carried to UNKNOWNS.md with phase-blocking annotation (BIG = Phase 4 blocker; others = launch blockers).

## Deferred ideas (out of Phase 0 scope)

- `llms.txt` — no proven retrieval effect 2026
- Multi-language EN — v2
- Headless CMS — v2
- Aggregate review schema — N/A given no-reviews decision
- Newsletter signup — v2
- Per-modality deep service pages — v2
- Blog / Artikelen / FAQ / Privacyverklaring / Algemene voorwaarden full content — v2
- Service worker / PWA — out of scope entirely

## Outcome

CONTEXT.md written. UNKNOWNS.md updated. Ready for `/gsd-plan-phase 0` after small docs-sync pass on PROJECT.md / REQUIREMENTS.md / ROADMAP.md to reflect Vercel + design overrides.
