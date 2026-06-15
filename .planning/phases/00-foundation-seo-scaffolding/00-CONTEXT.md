# Phase 0 Context — Foundation & SEO Scaffolding

**Phase:** 0
**Name:** Foundation & SEO Scaffolding
**Date:** 2026-06-15
**Discussion driver:** process-interviewer skill

## Domain

A deployable SvelteKit + Svelte 5 scaffold whose default output for any route is content + meta + JSON-LD in initial HTML. Primitives, robots.txt, sitemap, shared schema, design tokens, reserved stub URLs, and CI gates ship BEFORE any visible landing section is built. After this phase, Phase 1 (per-section landing build) can begin without re-deriving anything.

Requirements are locked by `.planning/REQUIREMENTS.md` (Phase 0 scope: FND-01..08, SEO-01..11, SCH-01..08, PRF-01, PRF-08, A11Y-05). Discussion below captures HOW.

## Canonical Refs

- `.planning/PROJECT.md` — project context, audience, core value (SEO/AEO over visuals)
- `.planning/REQUIREMENTS.md` — 84 v1 reqs; Phase 0 scope listed in traceability
- `.planning/ROADMAP.md` — 6 phases; this is Phase 0
- `.planning/research/SUMMARY.md` — research synthesis (note: stack reshapes per Vercel decision below)
- `.planning/research/STACK.md` — original picks; HOSTING superseded to Vercel + FRAMEWORK superseded to SvelteKit/Svelte 5 (2026-06-15)
- `.planning/research/ARCHITECTURE.md` — hub-spoke topical model, SEO-invariant primitives, build order
- `.planning/research/PITFALLS.md` — 20 pitfalls; Phase 0 lock-in prevents 9 of them
- `seo-aeo-samenvatting-checklist.md` — authoritative Dutch SEO/AEO playbook (Princeton/KDD 2024 GEO, HubSpot 2025, 2026 crawler refs)
- `.planning/phases/00-foundation-seo-scaffolding/UNKNOWNS.md` — single source of every still-missing fact; updated as facts land
- **Figma frames:** `Figma/Landingpage/Desktop/*.png` (6 frames) + `Figma/Landingpage/Mobile/*.png` (5 frames + menu open). All landing copy locked in design — see UNKNOWNS.md §Locked.

No ADRs in this project yet — decisions captured here become source of truth until SPEC.md / ADRs are created.

## Decisions

### Hosting & deploy

- **Hosting platform: Vercel** (NOT Cloudflare Pages). Decided 2026-06-15.
  - **Why:** user uses GitHub, prefers GitHub Actions CI, wants frictionless integration. Vercel auto-deploys from GitHub on push, auto-generates preview URLs per branch/PR, handles serverless functions in EU region.
  - **Astro adapter:** `@sveltejs/adapter-vercel` (replaces `@astrojs/cloudflare` in STACK.md).
  - **Region:** `fra1` (Frankfurt) for Vercel Functions — EU data residency.
  - **Production URL (interim):** `trinity-breath-healing.vercel.app` (no custom domain yet).
  - **Preview URLs:** Vercel auto-generates `*-trinity-breath-healing-<branch>.vercel.app` per PR.
  - **Custom domain:** `trinitybnh.nl` reserved/intended but NOT being registered or configured in Phase 0. Add later when aunt commits to launch timing.

- **CI: GitHub Actions** for tests + Lighthouse CI + pa11y/axe + JSON-LD validation.
  - **Why:** user uses GitHub, doesn't use Cloudflare; wants GHA over Vercel's built-in CI for portability + transparency.
  - Vercel still does deploy itself (via GitHub integration); GHA does the gates BEFORE the merge that triggers deploy.

- **Repository:** `trinity-breath-healing` on GitHub, **private**, owned by user.
  - Default branch: `main`.
  - Branch protection: require PR + passing CI before merge.

- **Staging vs production:** Vercel native pattern — every PR = preview URL, `main` = production. No separate `staging.<domain>` subdomain needed in v1.

### SEO / crawler config

- **`robots.txt` policy: explicit allow for search/RAG crawlers + training crawlers, then `User-agent: * Allow: /`.**
  - **Allowed (search/RAG):** `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`.
  - **Allowed (training, decided 2026-06-15):** `Google-Extended`, `Applebot-Extended`.
  - **Why training crawlers allowed:** wellness/breathwork content is non-sensitive, low IP-value to lose, high long-term citation surface to gain in Gemini + Apple Intelligence baseline knowledge.
  - Each allow block BEFORE the wildcard catchall — prevents the #1 AEO trap (wildcard `Disallow` shadowing the allows).
  - Sitemap reference at bottom.

- **`llms.txt` / `llms-full.txt`: NOT shipped.** No proven retrieval effect per project reference doc (2026 verified). Anti-cargo-cult.

- **Search Console verification: user's Google account.** DNS-TXT verification deferred until custom domain is connected. For Vercel-default `*.vercel.app`, use URL-prefix property + HTML-file verification in `public/`.

- **Hreflang infrastructure ready, Dutch-only content.** Site emits `<link rel="alternate" hreflang="nl" href="...">` + `<link rel="alternate" hreflang="x-default" href="...">` from day one. EN translation deferred to v2.

### Schema / JSON-LD architecture

- **Schema strategy: `Organization` + `ProfessionalService` + `Person` + per-service `Service` nodes in a single `@graph`** per page.
  - **NOT `LocalBusiness` with a visit-able storefront** — practitioner is mobile (at-client-home) + remote (energetic modalities) + Saturdays at a 3rd-party fysio clinic + own room in Almere. No customer-storefront semantic, so `LocalBusiness` is the wrong type. `ProfessionalService` (a `LocalBusiness` subclass) lets us emit `areaServed` + `serviceType` + non-public business address.
  - **`Person` schema** for the practitioner with `jobTitle`, `worksFor` (Organization), `memberOf` (when association memberships known).
  - **`Service` schema** per modality: Mahatma Healing, Goldhealing, Raster Energie, Spinal Touch. Each with `areaServed` and `provider` linked to the Organization.
  - **`WebSite` schema** with site search action (deferred — no search yet, but type-ready).
  - **`BreadcrumbList`** on every non-root page.
  - **`FAQPage`** — generated from the SAME source as the rendered FAQ section (single source of truth).
  - **`@id` strategy:** each shared node gets a stable `@id` like `https://trinitybnh.nl/#organization` for cross-page dedup. Use `SITE_URL` env even though URL changes per environment.

- **Service slugs (Dutch):** `mahatma-healing`, `goldhealing`, `raster-energie`, `spinal-touch`.

### Site structure (routes)

All routes return HTTP 200 from Phase 0 with stub pages (zero-301 v2 migration guarantee).

**Active in v1:**
- `/` — landing (built in Phase 1, all sections from Figma)

**Stubbed in Phase 0 (real content in v2+):**
- `/werkwijze`
- `/over-mij` (note: `over-mij` not `over-ons` — matches Figma nav)
- `/behandelingen`
- `/contact`
- `/diensten/mahatma-healing`
- `/diensten/goldhealing`
- `/diensten/raster-energie`
- `/diensten/spinal-touch`
- `/diensten` (index — "meer diensten" target)
- `/blog`
- `/artikelen`
- `/faq`
- `/privacyverklaring`
- `/algemene-voorwaarden`

**Dropped from earlier roadmap:**
- ~~`/boeken`~~ — booking is INLINE in landing contact section toggle (per Figma Frame 5). `/boeken` route eliminated. Landing contact section gets `id="contact"` anchor so external links can deep-link.
- ~~`/reviews`~~ — user explicitly chose no reviews in v1. Drop route entirely.

### Landing-page content overrides (from Figma + user direction)

- **Hero body wording: desktop variant** ("...belangrijke stappen naar herstel en evolutie.") — longer = more SEO surface. Mobile variant typography matches desktop content; if visual length forces a cut, cut from the end with `...` (CSS line-clamp not required since text is short).
- **Add inline FAQ section under contact/form section** (overrides Frame 5 design). FAQ is the AEO citation money block — losing it lose 30–41% AEO lift opportunity. **Section placement:** below the contact section toggle, above the footer. **8–12 questions, answer-first 50–150 words, JSON-LD FAQPage generated from same source.**
- **No testimonials on landing, no `/reviews` route** — user direction.
- **Eyebrow tags must mirror navigation labels:**
  - Frame 1 (hero): no eyebrow (matches Figma)
  - Frame 2 (3-card werkwijze): eyebrow = "Werkwijze" ✓ already correct
  - Frame 3 (about + stats): eyebrow = "Over mij" ✓ already correct
  - Frame 4 (service selector): eyebrow = **"Behandelingen"** (was "Werkwijze" in Figma — change to match nav)
  - Frame 5 (contact + form + booking toggle): eyebrow = **"Contact"** (was "Over mij" in Figma — change to match nav)
- **Footer placeholders to add** (Figma footer missing these):
  - `KvK: PLACEHOLDER` slot beneath phone
  - `BIG: PLACEHOLDER` slot (only if practitioner is BIG-registered — otherwise omit; tracked in UNKNOWNS)
- **No practitioner photo** — Figma uses illustration (tree + river). Hero LCP element = decorative illustration, not a photo. Saves "wait for photo" blocker entirely.

### Build approach

- **Mobile-first markup + structure built first, CSS layered to match Figma desktop after.** Decided 2026-06-15.
  - **Why:** user explicitly requested this approach. Mobile-first markup forces semantic discipline + accessibility from the start; desktop CSS layered via min-width media queries.
  - Applies to every section in Phase 1.

### Design tokens

- **Source of truth: deferred.** User will provide design tokens "when we get to that point."
- Phase 0 ships with **placeholder design tokens** in `src/styles/tokens.css` (CSS variables for color, spacing, radius, type, motion) marked with `/* TODO: replace with Figma values */`. Estimated palette from Figma frames as starter values:
  - `--color-bg-sand: #F2EBDD` (approx warm cream from frames)
  - `--color-fg-forest: #3A4530` (approx dark forest green from cards)
  - `--color-accent-gold: #D4A968` (approx gold from CTA + logo)
  - `--color-card-warm: #E8DEC8` (approx)
- These are PLACEHOLDERS — visual fidelity comes in a later phase when user provides exact tokens (likely Figma Dev Mode export or manual transcription).
- CI grep `grep -rE "TODO" src/styles/` flags these as still-pending pre-launch.

### Stack confirmations (carry forward from research; framework SWAPPED 2026-06-15)

- **Framework: SvelteKit + Svelte 5 (runes mode)** with TypeScript strict — SWAPPED from SvelteKit + Svelte 5 per user direction 2026-06-15
- **Adapter:** `@sveltejs/adapter-vercel` (region `fra1`)
- **Rendering posture:** SSG by default via `export const prerender = true` in `+layout.ts` (applies to all child routes) or per-route opt-out for the dynamic `/api/contact` endpoint
- **Routing:** filesystem-based, SvelteKit `src/routes/`
- **Styling:** Tailwind v4 build-time atomic CSS (works with Svelte 5 / Vite)
- **Content/MDX:** `mdsvex` (Svelte-native MDX preprocessor) — `.svx` files in `src/content/` consumed via Vite glob imports; Zod for type-safety on frontmatter
- **Schema-typed JSON-LD:** `schema-dts` (framework-agnostic types)
- **Head/meta:** `<svelte:head>` inside a reusable `<Head>` component + `<PageTitle>` component for one-H1 discipline
- **Images:** `@sveltejs/enhanced-img` (Vite plugin) — AVIF/WebP at build time, explicit width/height → CLS=0
- **Sitemap:** hand-rolled `src/routes/sitemap.xml/+server.ts` (no plug-and-play sitemap lib for SvelteKit equivalent to Astro's)
- **robots.txt:** static file at `static/robots.txt`
- **Forms / serverless:** SvelteKit `+server.ts` POST endpoints (deployed as Vercel Functions automatically)
- **Fonts:** self-hosted woff2 in `static/fonts/`, `font-display: swap`, metric-matched fallback
- **Analytics:** Plausible Cloud EU (cookieless, no banner)
- **Transactional email:** Resend `eu-west-1` (deferred to Phase 3 — not in Phase 0 scope)
- **Booking:** Cal.com inline embed (deferred to Phase 3 — not in Phase 0 scope)
- **Booking placement:** INSIDE landing contact section toggle (NOT separate /boeken page)
- **Scaffolding:** consider invoking the project-local `svelte-project` skill (and `plain-css-system` for the token system) to bootstrap a SvelteKit project with strict TypeScript, plain CSS variables for tokens, and the user's preferred conventions.

## Code Context

This is a **greenfield project**. No existing source files. `.claude/` and `.planning/` directories exist; codebase is the Figma designs + this planning material only.

**Existing assets to reuse:**
- `Figma/Landingpage/Desktop/*.png` (6 frames) — source of truth for desktop layout
- `Figma/Landingpage/Mobile/*.png` (5 frames + menu) — source of truth for mobile layout (gaps inferred from desktop: Frame 2 mobile accordion, Frame 4 mobile inactive-card style)
- `seo-aeo-samenvatting-checklist.md` — authoritative SEO/AEO playbook
- `.planning/research/*.md` — research outputs (note STACK.md hosting picks superseded for hosting only)

**No prior commits to inform patterns.** Phase 0 establishes the patterns the rest of the project will follow.

## Open Items (carried to UNKNOWNS.md)

All non-blocking-Phase-0 unknowns live in `.planning/phases/00-foundation-seo-scaffolding/UNKNOWNS.md`. Phase 0 ships with placeholders for: phone, KvK, BTW, BIG status, practitioner real name + bio "Vakkundig opgeleid" text, professional associations, logo files, favicon, OG image, hero illustration source SVG, exact design tokens.

**Decisions still expected from aunt** (does NOT block Phase 0):
- Phone (real E.164)
- KvK + BTW
- BIG status (CRITICAL — gates Phase 4 vocabulary review)
- Professional associations (CAT/NFG/RBCZ/none)
- "Vakkundig opgeleid" bullet real text
- Pricing decision (show on landing or not)
- Logo + favicon + OG image source files

**Decisions still expected from user** (does NOT block Phase 0):
- Exact design token values (Figma export approach)
- Whether custom domain `trinitybnh.nl` should be registered before launch or kept on `*.vercel.app` until traction

## Deferred Ideas

- `llms.txt` / `llms-full.txt` — no proven retrieval effect 2026
- Multi-language EN — v2 milestone (infrastructure ready)
- Headless CMS (Sanity EU) — v2 trigger: >50 pages OR >2 editors
- Aggregate review schema — only ships once >5 verified reviews exist (and only if user reverses the no-reviews decision)
- Newsletter signup — v2+
- Per-modality deep service pages — v2 (`/diensten/<slug>` stubs ship in v1 but full content waits)
- Blog + Artikelen + FAQ + Privacy + Algemene voorwaarden full content — v2 (routes stubbed in v1)
- Service worker / PWA — not needed for marketing site
- Aggregate review schema — see no-reviews decision above

## Success Criteria (carried from ROADMAP.md, restated)

1. `vite build` (SvelteKit's underlying build command) produces a clean Vercel deploy and `curl -A "OAI-SearchBot" https://trinity-breath-healing.vercel.app/` returns initial HTML containing exactly one `<h1>`, a 50–60-char `<title>`, a 150–160-char meta description, a canonical, and one `<script type="application/ld+json">`.
2. `/robots.txt` is served with explicit `Allow: /` blocks for OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-User, Google-Extended, Applebot-Extended placed BEFORE the wildcard `User-agent: *`; `/sitemap.xml` is auto-generated and referenced from robots.txt.
3. All 14 reserved routes (`/werkwijze`, `/over-mij`, `/behandelingen`, `/contact`, 4× `/diensten/<slug>`, `/diensten`, `/blog`, `/artikelen`, `/faq`, `/privacyverklaring`, `/algemene-voorwaarden`) return HTTP 200 with stub pages emitting per-page title + meta + canonical + JSON-LD.
4. GitHub Actions CI fails the build if any rendered route has zero or multiple `<h1>`, missing/duplicate meta description, an invalid canonical, an unparseable JSON-LD `@graph`, or a `schema-dts` type error.
5. Search Console URL-prefix verification via HTML-file method is set up against the Vercel-default URL (DNS-TXT verification deferred to custom-domain stage).
6. Repository is on GitHub at `trinity-breath-healing` (private), Vercel project auto-deploys from `main`, preview URLs auto-generate per PR.

## Next Step

`/gsd-plan-phase 0` — decompose Phase 0 into executable plans.

**Pre-plan housekeeping the planner should know:**
- PROJECT.md, REQUIREMENTS.md, ROADMAP.md still reference Cloudflare Pages in places. Planner should NOT treat those as authoritative for hosting — this CONTEXT.md is the override. Recommend a small docs-sync pass updating those three files BEFORE planning starts.
- The `/boeken` route + INT-05 requirement should be removed from REQUIREMENTS.md (booking is inline now).
- LND-13 (testimonials) and any `/reviews` references should be removed.
- Add new requirement: inline FAQ section under contact (LND-FAQ) + FAQPage JSON-LD source.
