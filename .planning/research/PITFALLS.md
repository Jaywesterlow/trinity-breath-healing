# Pitfalls Research

**Domain:** Dutch-language SEO/AEO-first marketing site for breathwork/healing practice (Trinity Breath & Healing)
**Researched:** 2026-06-14
**Confidence:** HIGH for SEO/AEO/Core Web Vitals (cross-referenced against `seo-aeo-samenvatting-checklist.md`, verified sources to 2026) · MEDIUM for Dutch advertising law + GDPR/AVG specifics (legal items flagged for practitioner/legal review before launch — no live web verification available this round) · HIGH for booking integration and phase/process pitfalls (well-known engineering failure modes)

> **Anti-cargo-cult disclosure:** `llms.txt` / `llms-full.txt` is explicitly EXCLUDED from this project. Reference doc (cross-checked 2026) confirms no proven retrieval effect; no AI-crawler vendor honors it. Listed here as a pitfall ("doing it instead of the proven work") rather than a feature.

---

## Critical Pitfalls

### Pitfall 1: Client-Side Rendering (CSR) Blinds AI Crawlers

**What goes wrong:**
The site ships an empty `<div id="app">` HTML shell. Googlebot defers JS rendering and may take days. Most AI crawlers (OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended) **do not execute JavaScript at all** — they fetch HTML and parse it. Result: zero indexable content, zero AI citations, project's primary success metric fails on day one.

**Why it happens:**
Default templates (Vite SPA, Create React App) ship CSR. "We'll just add SSR later" — but later means routing, data loading, and component design must be rewritten because client-only assumptions leaked everywhere.

**How to avoid:**
- Framework decision in Phase 0 must be SSR/SSG-native: SvelteKit, Next.js (App Router with `dynamic = 'force-static'` or `'force-dynamic'`), or Astro.
- Verify with `curl -A "OAI-SearchBot" https://yourdomain.tld/ | grep '<h1>'` — H1 must be present in raw HTML.
- Every page route prerenders or SSRs by default. Opt-in to client-only, never opt-out of server rendering.

**Warning signs:**
- "View source" in browser shows empty body or only `<script>` tags
- Google Search Console "Inspect URL → View crawled page" shows no content
- Site indexed but ranking only for brand name, not target queries

**Phase to address:** Phase 0 (framework selection) + Phase 1 (every route ships with content in initial HTML before any other feature).

**Source:** `seo-aeo-samenvatting-checklist.md` §5 ("De meeste AI-crawlers voeren geen JS uit"); industry-standard SSR/SSG guidance.

---

### Pitfall 2: Robots.txt Wildcard Disallow Above AI-Crawler Allow Rules

**What goes wrong:**
Inherited or template `robots.txt` contains `User-agent: * \n Disallow: /` (often a 2023–2024 anti-AI-training relic). Below it, well-intentioned `User-agent: OAI-SearchBot \n Allow: /` blocks are added. **Per robots.txt precedence rules, the most specific user-agent block wins** — but if the project copy-pastes an `Allow: /` under `*` with no user-agent block of its own, the wildcard disallow still applies. Result: site is silently invisible to AI search crawlers; AEO strategy is dead before content is written.

**Why it happens:**
Template inheritance, copy-paste from "block AI training" guides written in 2023, conflation of training crawlers (Google-Extended, GPTBot, ClaudeBot for training) with search/RAG crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-User).

**How to avoid:**
- Explicit per-crawler allow blocks. Sample (verify in Phase 1):

  ```
  User-agent: OAI-SearchBot
  Allow: /

  User-agent: ChatGPT-User
  Allow: /

  User-agent: PerplexityBot
  Allow: /

  User-agent: Perplexity-User
  Allow: /

  User-agent: ClaudeBot
  Allow: /

  User-agent: Claude-User
  Allow: /

  User-agent: Google-Extended
  Allow: /

  User-agent: Applebot-Extended
  Allow: /

  User-agent: *
  Allow: /

  Sitemap: https://yourdomain.tld/sitemap.xml
  ```

- **Decision required**: Google-Extended and Applebot-Extended are training crawlers (their content feeds AI training). Allowing them is the right posture *only if* you want your content used to train models (often the trade-off for higher long-term citation surface). Document this decision in `.planning/PROJECT.md`.
- Test with `curl -A "OAI-SearchBot" https://yourdomain.tld/robots.txt` and a robots.txt validator.

**Warning signs:**
- Site appears in Google but never in Perplexity/ChatGPT/Claude responses on relevant queries
- Server logs show no hits from `OAI-SearchBot`, `PerplexityBot`, etc.

**Phase to address:** Phase 1 (initial deployment) — robots.txt must ship with first deploy, not bolted on later.

**Source:** `seo-aeo-samenvatting-checklist.md` §Deel 2 #3 (2026 AI-crawler refs); Google's robots.txt spec on user-agent specificity.

---

### Pitfall 3: Unsubstantiated Health Claims Under Dutch Advertising Law

**What goes wrong:**
Site copy says "breathwork geneest trauma" / "ademwerk lost burn-out op" / "100% effectief tegen angst." Under Dutch advertising regulation (Reclame Code Commissie + Nederlandse Reclame Code, NVWA oversight for health products, and Wet op de Geneeskundige Behandelingsovereenkomst-adjacent rules for therapeutic claims), unsubstantiated medical/therapeutic claims trigger complaints, takedown orders, and reputational damage. Breathwork is not a regulated medical treatment; positioning it as curative is legally risky.

**Why it happens:**
Marketing instinct: stronger claim = stronger conversion. Practitioner enthusiasm. Translating English wellness copy ("heals trauma") directly to Dutch without legal filter.

**How to avoke:**
- **Frame as experience, not therapy.** Use: "begeleidt bij het ervaren van...", "ondersteunt...", "ruimte voor lichaam en adem", "veel cliënten ervaren...". Avoid: "geneest", "behandelt", "lost op", "100%", "gegarandeerd".
- Add a visible disclaimer on the landing page (preferably near booking CTA and in footer):

  > "Ademwerk en healing-sessies van Trinity Breath & Healing zijn een aanvulling op, geen vervanging van, reguliere medische of psychologische zorg. Bij medische of psychische klachten: raadpleeg een arts of GZ-psycholoog."

- **Trauma trigger warning** on any section discussing trauma release: "Deze content gaat over trauma. Als je momenteel in acute psychische nood verkeert: bel 113 (Zelfmoordpreventie) of je huisarts."
- Practitioner credentials shown explicitly (training, lineage, years of experience) — frames as experiential expertise, not medical authority.
- Anti-cargo-cult: do NOT invent statistics about breathwork efficacy. If citing research (e.g., Holotropic Breathwork studies, Wim Hof Method peer-reviewed work), link to the actual study with `cite` attribution.

**Warning signs:**
- Copy uses any of: "genezen", "behandelen", "100%", "gegarandeerd", "wetenschappelijk bewezen" (without citation)
- No disclaimer visible above the fold or in footer
- Testimonials make medical claims ("mijn depressie is weg")

**Phase to address:** Phase 2 (content writing) AND Phase 5 (legal review before launch). Practitioner (the aunt) must sign off on every health-adjacent claim.

**Confidence:** MEDIUM (legal interpretation, not live-verified this round). Flag for legal review.

**Source:** Nederlandse Reclame Code (reclamecode.nl), NVWA guidance on health claims, general EU practice for wellness/complementary modality marketing. Confirm specifics with Dutch counsel before launch.

---

### Pitfall 4: Marketing-Speak Hedge Language Kills AI Citations

**What goes wrong:**
Copy uses "misschien", "zou kunnen", "wij denken dat...", "wellicht is dit iets voor jou." AI engines extract **definitive, standalone statements**; hedged content offers nothing citation-worthy. Per KDD 2024 GEO research, the citation lift comes from specific, attributed, declarative content. Hedge-language content is filtered out at the synthesis step.

**Why it happens:**
Two collisions: (a) the wellness niche's gentle voice instinct, (b) the legal pressure from Pitfall 3 pushing toward hedge language. These pull *against* AEO requirements.

**How to avoid:**
- **Two-sentence pattern:** definitive answer in sentence 1, nuance/safety in sentence 2.
  - Bad: "Ademwerk kan misschien helpen bij stress."
  - Good: "Ademwerk is een lichaamsgerichte methode waarbij bewuste ademhaling het zenuwstelsel reguleert. Ervaringen verschillen per persoon; raadpleeg een arts bij medische klachten."
- Add concrete statistics with attribution (Princeton/KDD 2024: +32% from statistics, +30% from sources, +41% from quotes).
- FAQ headings as the user's actual question, answer-first in the first sentence.
- "Definitive but framed as experience" — not a medical claim, but not wishy-washy either.

**Warning signs:**
- Search for "misschien", "zou kunnen", "wellicht", "we denken" in copy — flag every instance
- Paste any section into Perplexity and ask "summarize this in one sentence" — if Perplexity can't, the content isn't citation-ready
- FAQ answers start with anything other than the answer itself

**Phase to address:** Phase 2 (content writing) — content guide with "definitief + nuance" pattern baked in from day one.

**Source:** `seo-aeo-samenvatting-checklist.md` §7 + §Deel 2 #1 (Aggarwal et al., KDD 2024, arXiv:2311.09735).

---

### Pitfall 5: SEO/AEO Deprioritized as "We'll Add It Later"

**What goes wrong:**
Phase 1 ships "the hero" without SSR, without meta tags, without robots.txt, without canonical, without JSON-LD — "we'll add it in Phase 5 polish." But: framework choice that enables late SSR retrofit is rare; meta tags depend on routing architecture; JSON-LD depends on content modeling; canonical URLs depend on URL strategy. By Phase 5, retrofitting these requires rewrites, not additions. Project's stated primary success metric (SEO/AEO) is treated as a feature instead of an architectural constraint.

**Why it happens:**
Visual progress is rewarding; invisible technical groundwork isn't. User's "hero first, mobile first, per section" granularity bias toward what's photogenic over what's foundational.

**How to avoid:**
- **Phase 0 (before any code):** lock framework to SSR/SSG-native; agree on URL structure; sketch JSON-LD types; write the meta-tag schema.
- **Phase 1 (first deploy, even with placeholder content):** ship robots.txt, sitemap.xml, canonical tags, base `<title>`/`<meta description>` per route, `Organization` + `LocalBusiness` JSON-LD stubs, Open Graph defaults, semantic HTML5 landmarks. This is "the SEO scaffolding deploy" — visible-progress price is low because the page can be a near-empty Figma-faithful hero, but the **plumbing is set**.
- **Every subsequent phase:** PR template includes "SEO/AEO regression check" (unique title? unique meta description? canonical present? JSON-LD valid? H1 unique? content in initial HTML?).
- **Definition of Done for any visible section:** content rendered server-side, headings semantic, Lighthouse SEO score 100, Rich Results Test passes.

**Warning signs:**
- Phase 1 PR contains zero SEO files (no robots.txt, no sitemap, no JSON-LD)
- A section ships without unique `<title>` or with duplicated meta description
- Lighthouse SEO score drops between phases

**Phase to address:** Phase 0 (architecture lock-in) and **enforced in every phase**.

**Source:** Project's explicit constraint in `.planning/PROJECT.md` ("SEO/AEO is primary success metric — overrides aesthetic preferences").

---

### Pitfall 6: JS-Injected Meta Tags / Lazy-Loaded H1 / Hero Invisible to First Bot Fetch

**What goes wrong:**
Hero H1 is rendered by a client component (e.g., for animation). Meta description is set via `<script>` after hydration. Hero image is lazy-loaded. Bot's first HTML fetch contains no H1, no meta description, no hero image URL — site is ranked as low-quality empty content.

**Why it happens:**
Animation libraries (Framer Motion, GSAP) often suggest client-only rendering. Meta managers (react-helmet without SSR) update tags client-side. `loading="lazy"` reflex applied to every image including hero.

**How to avoid:**
- H1 and visible-above-the-fold content are server-rendered. Animation runs on hydration, but the content exists in HTML before JS.
- Meta tags via framework SSR primitives: SvelteKit `<svelte:head>` in `+page.svelte`, Next.js `metadata` export, Astro `<head>` in layout. Validate with View Source.
- **Hero image: never `loading="lazy"`.** Add `<link rel="preload" as="image" href="..." fetchpriority="high">` for LCP candidate. All other images: `loading="lazy"`, `decoding="async"`, explicit `width`/`height`.
- Lighthouse LCP audit must identify the hero image as LCP element, sub-2.5s.

**Warning signs:**
- `curl https://yourdomain.tld/ | grep -i '<h1\|<meta name="description"\|hero'` returns nothing or partial
- Lighthouse LCP > 2.5s
- Lighthouse "Largest Contentful Paint image was lazily loaded" warning

**Phase to address:** Phase 1 (initial hero deploy) — the hero is the highest-stakes section for both LCP and bot first-impression.

**Source:** `seo-aeo-samenvatting-checklist.md` §5 + §9 (Core Web Vitals).

---

### Pitfall 7: GDPR / AVG Violations on Contact + Booking Forms

**What goes wrong:**
Form collects name + email + phone + "wat speelt er bij jou?" free-text field. Submission saves to server logs with IP address. No privacy policy. No consent checkbox. No data retention policy. No legal basis declared. Under AVG (Dutch implementation of GDPR), this is a violation: free-text "wat speelt er" likely contains special-category data (health/mental health), which requires explicit consent and additional safeguards.

**Why it happens:**
"It's just a contact form" — but contact forms in a health-adjacent niche routinely receive sensitive data the practitioner didn't intend to collect.

**How to avoid:**
- **Legal basis: explicit consent** for the contact/booking form. Checkbox (unticked by default) with link to privacy policy. Text: "Ik ga akkoord met de verwerking van mijn gegevens zoals beschreven in de [privacyverklaring]."
- **Privacy policy page** (link from footer + form): controller identity, what's collected, why, retention period, third-party processors (booking provider, email sender, hosting), data subject rights, contact for requests, complaint route to Autoriteit Persoonsgegevens.
- **Form field design:** add explicit warning *above* the free-text field: "Deel hier alleen wat je veilig vindt om te delen. Voor uitgebreide intake-informatie volgt een persoonlijk gesprek." Discourages dumping sensitive history on first contact.
- **No PHI fields in v1.** Do NOT include "huidige medicatie", "diagnose", "psychische geschiedenis" intake checkboxes on the website — that intake happens during the session. (Already in `.planning/PROJECT.md` Out of Scope; reinforce in form design.)
- **Retention:** 1 year max for unconverted leads, document in privacy policy.
- **IP logging:** if server logs IP, declare it; consider not logging IP on form endpoints specifically.
- **Cookie banner:** required only if analytics/marketing cookies are set. If using a fully cookieless analytics (Plausible, simple-analytics, Fathom, server-side Umami), **no consent banner required** under AVG/ePrivacy — significant UX + Core Web Vitals win. If using Google Analytics or any tracking cookies: TCF-compliant consent banner required, with consent denied by default until user opts in.

**Warning signs:**
- Form has no consent checkbox
- No link to privacy policy in footer or form
- Analytics provider sets cookies without consent
- Form successfully submits even when consent unchecked

**Phase to address:** Phase 3 (form implementation) AND Phase 5 (legal review before launch).

**Confidence:** MEDIUM (general AVG/GDPR principles HIGH; product-specific application MEDIUM — confirm with Dutch counsel before launch).

**Source:** AVG (Algemene Verordening Gegevensbescherming), Autoriteit Persoonsgegevens guidance, ePrivacy Directive on cookies. Cookieless-analytics-no-banner pattern is widely confirmed by Plausible/Fathom legal write-ups.

---

### Pitfall 8: Third-Party Booking Widget Destroys Core Web Vitals

**What goes wrong:**
Calendly / Cal.com / Setmore embed ships 300–800kb of JS, iframe loads on page render, blocks main thread, INP spikes >500ms, LCP regresses, CLS jumps when widget loads after content. Worst case: the widget IS the LCP element and is lazy in an iframe — LCP > 5s. Project's <2.5s LCP / <200ms INP targets are missed by Phase 3.

**Why it happens:**
Default embed snippets prioritize convenience over performance. "Add a `<script>` tag and a `<div>`" — but those scripts load synchronously and block everything.

**How to avoid:**
- **Decouple booking from initial page load.** Default state: booking section shows a CTA button ("Reserveer een gratis kennismaking") and a static description. Widget loads only on click (lazy import / dynamic injection).
- Alternatively: link to a dedicated `/boeken` route — keeps landing page clean for SEO + CWV.
- **Prefer Cal.com's link/popup mode** over inline embed for the landing page. Or use Cal.com's `<button>` element approach (defers initialization). Calendly has a similar `Calendly.initPopupWidget` pattern.
- **Test CWV after integration:** Lighthouse + Chrome DevTools Performance panel + actual mobile device (not desktop only). PageSpeed Insights field data (CrUX) once site has traffic.
- **Trade-off:** inline calendar is better UX for warm Instagram traffic; CTA + popup is better SEO/CWV for cold search traffic. **Recommendation:** CTA + popup on landing, dedicated `/boeken` for inline experience after click-through (both audiences served, neither penalized).

**Warning signs:**
- Lighthouse Performance score drops 20+ points after adding booking
- Total Blocking Time > 200ms
- LCP element identified as the booking widget iframe

**Phase to address:** Phase 4 (booking integration) — defer past initial SEO/AEO foundation. Performance budget enforced.

**Source:** Cal.com and Calendly docs on embed modes; standard third-party-embed CWV pattern from web.dev "Optimize third-party JavaScript."

---

### Pitfall 9: Form Submissions Going to Spam (No SPF/DKIM/DMARC)

**What goes wrong:**
Contact form sends via SMTP from `noreply@trinitybreath.nl` to practitioner's `aunt@gmail.com`. No SPF/DKIM/DMARC on `trinitybreath.nl`. Gmail flags as spam. Practitioner never sees submissions. Conversion funnel broken silently. Months of SEO work yields no contacts.

**Why it happens:**
Domain registrars don't set up email DNS by default. Transactional senders (Resend, Postmark, SendGrid) require domain verification. "We'll just send via SMTP" loses against modern spam filters.

**How to avoid:**
- Use a transactional email provider (Resend, Postmark, AWS SES) — not raw SMTP from your hosting.
- Verify domain in provider: add SPF (`v=spf1 include:spf.resend.com ~all` or equivalent), DKIM (CNAME records the provider gives), DMARC (`v=DMARC1; p=quarantine; rua=mailto:dmarc@trinitybreath.nl`).
- **From-address:** use a real domain address, not `noreply@`. Reply-To set to the practitioner's actual address so she can reply directly to the prospect.
- **End-to-end test before launch:** submit form, confirm email arrives in practitioner's inbox (not spam), verify Reply-To works. Test from Gmail, Outlook, iCloud at minimum.
- **Bonus:** also send the prospect a confirmation email ("Bedankt voor je bericht, ik neem binnen 2 werkdagen contact op"). This is double-opt-in lite for the GDPR storage of their address and good UX. Requires their consent (Pitfall 7).

**Warning signs:**
- Practitioner reports "no one is contacting me" after launch
- Test submissions land in spam
- DMARC reports show fail-rates

**Phase to address:** Phase 3 (form implementation) — DNS records take up to 48h to propagate, set up early.

**Source:** General transactional-email best practice; Gmail Sender Guidelines (Feb 2024) require SPF + DKIM + DMARC for bulk senders and increasingly for any volume.

---

### Pitfall 10: Google Meet Booking Failing Silently

**What goes wrong:**
Booking flow creates calendar event but Google Meet link doesn't generate (Cal.com / Calendly misconfigured, OAuth scope missing, or Calendar API call fails). Confirmation email goes out without join link. Prospect shows up with nothing to click; practitioner discovers at session start. Reputational damage on first impression — exactly the audience SEO/AEO worked to attract.

**Why it happens:**
Google Calendar API requires specific scopes (`https://www.googleapis.com/auth/calendar.events` + `conferenceData` permission). Booking integrations often have a Meet toggle that defaults off, or fails silently when token expires.

**How to avoid:**
- **At integration time:** enable conferencing on every event type. Cal.com: per-event-type "Location: Google Meet." Calendly: per-event-type Conferencing → Google Meet.
- **OAuth token refresh:** monitor Cal.com/Calendly integration health page weekly during first 90 days.
- **Confirmation email manual check:** every confirmation email template should display the Meet link prominently. If template is missing the merge field, every booking is broken.
- **Timezone trap:** site is Dutch, audience is in CET/CEST (UTC+1 / UTC+2). Cal.com/Calendly defaults to admin's timezone; verify it's `Europe/Amsterdam` and that DST transitions don't shift session times. Test bookings across the March/October DST switches.
- **End-to-end test as a real user:** book a session yourself from incognito, verify Meet link in confirmation, verify calendar shows correct time in CEST/CET, join the Meet to confirm.

**Warning signs:**
- Confirmation email has placeholder text where Meet link should be
- Practitioner's calendar shows event but no conference attached
- Test booking time is off by 1 hour (timezone bug)

**Phase to address:** Phase 4 (booking integration) — pre-launch checklist item.

**Source:** Cal.com and Calendly integration docs; Google Calendar API conferenceData v2 documentation.

---

### Pitfall 11: Testimonials Without Consent or With Medical Claims

**What goes wrong:**
Practitioner posts client testimonial: "Na 3 sessies was mijn PTSS weg — Mariska, 34." No documented consent. Testimonial makes a medical claim ("PTSS weg"). Under AVG, the testimonial contains health data of an identifiable person without explicit consent. Under Dutch advertising rules (Reclame Code), the medical claim is unsubstantiated. Double risk: privacy complaint + advertising complaint.

**Why it happens:**
Genuine enthusiasm; client said it freely; practitioner doesn't realize publishing on a public site requires written consent + that medical claims in testimonials are treated as the practitioner's own claims under advertising law.

**How to avoid:**
- **Written consent form** before publishing any testimonial. Specifies: exact quote, where it will be displayed, right to withdraw, retention period. Keep on file.
- **Anonymize by default**: first name + age + city is enough warmth; no photo or full name without explicit consent.
- **Frame testimonials as experience, not outcome:** "Na de sessies voel ik me meer aanwezig in mijn lichaam" is fine; "mijn PTSS is genezen" is not.
- **No diagnosis names** in testimonials (PTSS, burn-out, depressie). Use experiential language: "spanning", "vermoeidheid", "vastzitten in mijn lichaam".
- **Visible Person JSON-LD only with explicit consent** for the practitioner herself, never for clients.

**Warning signs:**
- Any testimonial contains a diagnosis name
- No paper trail of consent for displayed testimonials
- Photo of testifier without explicit photo-use consent

**Phase to address:** Phase 2 (content writing) — testimonial intake template + consent form must exist before any testimonial goes live.

**Confidence:** MEDIUM. Legal review before launch.

**Source:** AVG Art. 9 (special categories of personal data), Nederlandse Reclame Code on testimonials, general practice in wellness niche.

---

### Pitfall 12: Entity / NAP Inconsistency Across Web

**What goes wrong:**
Site says "Trinity Breath & Healing, Hoofdstraat 12, Amsterdam, 020-1234567." Instagram bio says "Trinity B&H, Amsterdam." Google Business Profile not claimed. KvK listing has slightly different address. AI entity-recognition (which is how Perplexity, ChatGPT, AI Overviews verify "is this the same business across sources?") fails to link the references. Authority signal is fragmented; citations go to better-consolidated competitors.

**Why it happens:**
Organic growth across platforms over time; no single source of truth; rebrand or address change not propagated.

**How to avoid:**
- **Canonical NAP block** in `.planning/PROJECT.md` (or a content source-of-truth doc): exact business name, exact address, exact phone (E.164: `+31201234567`), email, website URL.
- Render this NAP identically in footer + `LocalBusiness` JSON-LD + contact section.
- **Off-site consistency checklist (Phase 5):** Instagram bio, Google Business Profile (claim it), KvK, any directories, Facebook page, LinkedIn (if applicable) — all match canonical NAP exactly.
- **`sameAs` array in Organization JSON-LD** lists every social/directory URL (Instagram, LinkedIn, etc.) — gives AI explicit graph edges.
- **Phone format:** `tel:+31201234567` for click-to-call; display as `020-1234567` or `+31 20 1234567` consistently.

**Warning signs:**
- Google "Trinity Breath & Healing" — multiple variant names appear
- Instagram and site have different addresses or phone numbers
- Google Business Profile shows "Suggest an edit" by users

**Phase to address:** Phase 2 (content) + Phase 5 (off-site consistency audit before launch).

**Source:** `seo-aeo-samenvatting-checklist.md` §Deel 2 #6 (entity consistency).

---

### Pitfall 13: FAQ Without FAQPage JSON-LD

**What goes wrong:**
Site has a beautiful FAQ accordion. No `FAQPage` JSON-LD wrapped around it. Google's rich-result eligibility lost. AI engines don't recognize the structure as Q&A. Massive AEO opportunity squandered.

**Why it happens:**
FAQPage JSON-LD is added "later" but the accordion is a client component, so retrofitting is fiddly; or the dev assumes the semantic HTML alone is enough.

**How to avoid:**
- FAQ data is content, not just UI. Author it as structured data first (array of `{question, answer}`), then render both the accordion AND the JSON-LD `<script type="application/ld+json">` from the same source.
- **Note (2026 reality):** Google has restricted FAQPage rich-result eligibility to government/health-authority sites in many regions. Implement FAQPage anyway: (a) AI engines (Perplexity/Claude/ChatGPT) still use it for extraction, (b) it's free metadata, (c) Google may broaden eligibility again.
- Validate with Google Rich Results Test before each deploy.
- Answer-first inside the JSON-LD `acceptedAnswer.text`: first sentence is the answer, rest is nuance — same rule as visible content.

**Warning signs:**
- View page source: no `"@type": "FAQPage"` script
- Rich Results Test reports zero structured data on FAQ page

**Phase to address:** Phase 2 (FAQ section build).

**Source:** `seo-aeo-samenvatting-checklist.md` §6; Google FAQ structured data documentation; AI-citation extraction patterns.

---

### Pitfall 14: SPA Deeplink 404s

**What goes wrong:**
After URL strategy lets `/diensten/ademwerk` work as a route, deeplinks to it get the SPA shell with no server-side fallback. Google indexes a soft-404; sharing the URL on Instagram returns a blank screen for users with slow JS.

**Why it happens:**
Default hosting (S3 static, basic Nginx) doesn't rewrite all paths to `index.html` unless configured. SvelteKit/Next/Astro handle this if SSR/SSG is enabled per-route, but a misconfigured deploy adapter breaks it.

**How to avoid:**
- SSR/SSG framework with **prerender enabled per route** (or fallback SSR). Verify each route in the build output ships an HTML file.
- Test every public route with `curl -I` from a fresh terminal: must return 200, not 404 or 304-via-rewrite.
- Hosting platform that supports SPA fallback if needed (Vercel, Netlify, Cloudflare Pages all do this natively for the framework's adapter).
- 404 page is a real 404 with status code, not a soft-200 redirect.

**Warning signs:**
- `curl -I https://yourdomain.tld/some/route` returns 200 but page content is empty
- Search Console: "Crawled - currently not indexed" or "Soft 404" reports

**Phase to address:** Phase 1 (initial deploy) + each phase that adds a route.

**Source:** `seo-aeo-samenvatting-checklist.md` §5 + standard SPA-routing SEO patterns.

---

### Pitfall 15: Canonical Tag Mistakes

**What goes wrong:**
Canonical tag points to wrong domain (`https://www.` when site lives at root, or `http://` when site is HTTPS). Or canonical missing on key pages — duplicate-content penalty risk. Or canonical points to homepage from every page — only homepage gets indexed.

**Why it happens:**
Copy-paste from another project. Reverse proxy or hosting redirect changes the canonical domain after a migration.

**How to avoid:**
- Canonical generated dynamically from request URL: `<link rel="canonical" href="{site.url}{page.path}">` with `site.url` as a single env var.
- Site URL is one canonical source of truth in env / config. No hardcoded variants.
- Self-referencing canonical on every page (including homepage).
- HTTP → HTTPS redirect at hosting level; only HTTPS in canonical.
- `www` vs root: pick one, redirect the other with 301.
- Validate via Lighthouse, Screaming Frog, or `curl https://yourdomain.tld/ | grep canonical`.

**Warning signs:**
- Search Console: "Duplicate without user-selected canonical" warnings
- Page indexed under a URL different from canonical
- Mixed `http://` and `https://` in indexed results

**Phase to address:** Phase 1 (initial SEO scaffolding deploy).

**Source:** `seo-aeo-samenvatting-checklist.md` §A.

---

### Pitfall 16: Sitemap / Robots Mismatch

**What goes wrong:**
robots.txt blocks `/about/`; sitemap lists `/about/`. Or sitemap is at `/sitemap.xml` but robots.txt declares `/sitemap_index.xml`. Or sitemap contains URLs that 404. Or sitemap not generated automatically and goes stale.

**Why it happens:**
Static sitemap manually maintained. Framework's sitemap plugin not configured to exclude same routes that robots disallows.

**How to avoid:**
- **Automated sitemap generation** from the framework's route manifest (`@sveltejs/enhanced-img`/`svelte-sitemap`, `next-sitemap`, `@astrojs/sitemap`). Regenerates on every build.
- robots.txt explicitly references the sitemap URL with the correct path.
- Routes that are disallowed in robots are also excluded from sitemap.
- Validate after deploy: `curl https://yourdomain.tld/sitemap.xml` lists only real, 200-status URLs.
- Submit sitemap in Search Console.

**Warning signs:**
- Search Console: "Submitted URL blocked by robots.txt"
- Sitemap lists pages that have been deleted
- Sitemap is identical week-over-week despite content changes

**Phase to address:** Phase 1 (initial deploy) + automated regeneration on every build.

**Source:** `seo-aeo-samenvatting-checklist.md` §A.

---

### Pitfall 17: Hreflang Errors When Adding Locales Later

**What goes wrong:**
v2 adds English translation at `/en/`. Hreflang tags reference URLs that don't exist (`hreflang="nl-BE"` while only `nl-NL` and `en-GB` exist). Or hreflang missing `x-default`. Or non-symmetric (NL page links to EN, EN page doesn't link back to NL). Google demotes both versions; AEO entity confusion.

**Why it happens:**
Hreflang requires symmetry across the whole language graph; trivial to break when adding a locale piecemeal.

**How to avoid:**
- **Architecture-ready in v1** even though only Dutch ships: routing supports `/[lang]/...` or subdomain pattern from the start; hreflang infrastructure exists but only `nl-NL` is emitted.
- When EN is added: hreflang tags emitted symmetrically on every page in every language; include `x-default` pointing to NL (primary audience).
- Each translated URL exists as a real page (not just a redirect).
- Validate with Search Console "International Targeting" report.
- Use a hreflang validator (e.g., Merkle, Aleyda Solis's tool) before launch.

**Warning signs:**
- Search Console: "No return tags" errors
- One language version ranks while the other doesn't
- `curl <url> | grep hreflang` shows asymmetric counts between pages

**Phase to address:** Phase 1 (architecture decision) + future locale phase.

**Source:** `seo-aeo-samenvatting-checklist.md` §A; Google hreflang documentation.

---

### Pitfall 18: Core Web Vitals Regression — Web Fonts and Animation

**What goes wrong:**
Custom web font loads via `<link href="https://fonts.googleapis.com/...">` blocks render. FOIT (Flash of Invisible Text) makes hero text appear late → LCP regresses past 2.5s. Decorative animations (parallax, GSAP-driven hero) shift layout → CLS spikes past 0.1. Long JS tasks in event handlers (heavy click handler on CTA) → INP past 200ms.

**Why it happens:**
Design fidelity pressure: "Figma uses this font, we must match exactly." Animation libraries imported as default. Click handlers grow as features accrete.

**How to avoid:**
- **Self-host fonts** (download from Google Fonts, serve from same origin). Use `font-display: swap` to avoid FOIT; preload the primary weight `<link rel="preload" as="font" type="font/woff2" crossorigin>`. Only ship weights actually used (2–3 max).
- **Or: system font stack** for body + custom font only for headings — significant CWV win.
- **Animation budget:** decorative animations CSS-only where possible. JS animation only for one element max above the fold. `prefers-reduced-motion` respected.
- **Reserve space for all dynamic content** (images with `width`/`height`, font fallback metrics matched via `size-adjust` or `font-display: swap` + `font-size-adjust`).
- **Long tasks:** break handlers with `await new Promise(r => setTimeout(r, 0))` or use `scheduler.yield()` (where supported) for non-critical work after click.
- **Real device test:** mid-range Android (~Moto G Power class) on throttled 4G via DevTools or BrowserStack. Desktop Lighthouse is not enough.

**Warning signs:**
- Lighthouse Performance < 90 on mobile
- LCP element is text, but text appears 1+ seconds after page paint
- CLS > 0.1 in CrUX report once site has traffic

**Phase to address:** Phase 1 (font + hero) + every phase that adds JS-heavy interactions.

**Source:** `seo-aeo-samenvatting-checklist.md` §9; web.dev Core Web Vitals guidance (LCP, INP, CLS).

---

### Pitfall 19: No Author / Practitioner Identity → E-E-A-T Fail

**What goes wrong:**
Site presents Trinity Breath & Healing as a brand with no human attached. No author name on content. No "Over de begeleider" section with credentials, training, lineage. No Person JSON-LD. E-E-A-T signal absent → AI engines deprioritize the site for citations (Princeton/KDD 2024: expertise signals improve citation). For health-adjacent content this is especially severe — AI engines weight YMYL (Your Money Your Life) content heavily on author authority.

**Why it happens:**
Brand-first marketing instinct; privacy preference of the practitioner; "the work speaks for itself" attitude.

**How to avoid:**
- **Visible "Over [practitioner name]" section** on landing page with: name, photo (optional but recommended for trust), training/credentials (specific schools, years), how long practicing, lineage/teachers, why this work.
- **Person JSON-LD** linked to Organization via `founder` / `employee`:
  ```json
  { "@type": "Person", "name": "...", "jobTitle": "Ademwerk begeleider",
    "alumniOf": "...", "sameAs": ["https://instagram.com/..."] }
  ```
- Author byline on any blog/kennisbank content (v2+).
- LinkedIn or professional bio elsewhere strengthens entity (per Pitfall 12).
- If practitioner prefers low public profile: minimum-viable identity (first name + credentials + photo from shoulders down or hands-only) — still better than no identity.

**Warning signs:**
- No human name visible above the fold on landing
- View source: no `Person` JSON-LD
- "Wie zit erachter?" not answerable from the homepage in 5 seconds

**Phase to address:** Phase 2 (content writing) — Over-section is core landing content.

**Source:** `seo-aeo-samenvatting-checklist.md` §8 + §Deel 2 #1 (KDD 2024); Google's E-E-A-T guidance in Search Quality Evaluator Guidelines.

---

### Pitfall 20: Granularity Bias — "Hero First, Mobile First, Per Section"

**What goes wrong:**
User-stated approach is high-resolution: build hero mobile-first, polish, then next section. Risk: each section reaches "complete" before the **cross-cutting concerns** (SEO scaffolding, JSON-LD model, accessibility audit, performance budget) are addressed. By Phase 5, retrofitting cross-cutting concerns requires touching every section, regressing the visual fidelity that was the original priority.

**Why it happens:**
Visual progress is motivating; cross-cutting work is invisible. The granularity makes per-section progress feel solid, masking architecture debt.

**How to avoid:**
- **Phase 0 lock-in** before any section: framework, URL structure, meta-tag schema, JSON-LD content model, performance budget (LCP < 2.5s, INP < 200ms, CLS < 0.1), accessibility baseline (WCAG 2.2 AA), content guide (Pitfall 4's two-sentence pattern).
- **Definition of Done per section** includes ALL of: visual fidelity to Figma + content in initial HTML + unique H1/title/meta + relevant JSON-LD + Lighthouse SEO 100 + Lighthouse A11y 100 + CWV targets met + Dutch copy reviewed for hedge language and unsubstantiated claims.
- **Cross-cutting concerns are not sections; they are gates.** No section ships unless gates pass.
- **Frame 2 mobile accordion / Frame 4 mobile active state:** infer from desktop counterparts (per PROJECT.md), document the inference in a comment, and review with the user before locking. Don't silently invent.

**Warning signs:**
- A section is declared "done" but missing JSON-LD or unique meta description
- Lighthouse score drops between sections instead of staying flat
- Phase 5 backlog grows with "SEO/A11y for [section X]" items

**Phase to address:** Phase 0 (define gates) + every phase (enforce gates).

**Source:** Project-specific from `.planning/PROJECT.md` + general experience.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip robots.txt, "deploy first" | Faster Phase 1 ship | Site indexed by wrong crawlers, AI-bots blocked, weeks of lost citations before discovered | **Never** — robots.txt is 10 lines, ship with Phase 1 |
| Inline meta tags via `react-helmet` / equivalent client-only manager | Familiar pattern | Meta tags absent from initial HTML; AI crawlers see empty `<title>` | **Never** for this project — use framework SSR primitives |
| Calendly inline embed on landing | "Just works" booking | CWV regression, blocks LCP, JS bloat | Only behind a CTA-click trigger, never on initial page load |
| Google Analytics 4 with consent banner | "Standard" analytics | Cookie banner hurts UX + CWV; AVG compliance overhead | Only if marketing team needs GA-specific reports — otherwise use cookieless |
| `loading="lazy"` on every image including hero | Single rule to remember | Hero LCP > 4s; SEO penalty | **Never** for hero/LCP candidate; `lazy` only below fold |
| Manual sitemap.xml | Quick start | Goes stale, misses pages, references deleted URLs | Only for sites < 5 pages with no plans to add — otherwise auto-generate |
| Hedge-language wellness copy | Legal comfort | AI engines don't cite it; primary success metric fails | **Never** as the only voice; pair with two-sentence pattern (definitive + nuance) |
| `llms.txt` / `llms-full.txt` | Feels future-proof | No proven effect; distracts from real work | **Never** in 2026 — explicitly out of scope per PROJECT.md |
| Single env var `SITE_URL` with default `localhost:3000` baked into prod | Easy local dev | Canonical and OG URLs leak `localhost` into production HTML | **Never** — env var required, no default to localhost in build |
| Per-page hand-written JSON-LD | Total control | Drift between pages, schema typos go unnoticed | Only for 1–3 page sites; otherwise generate from data model |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cal.com / Calendly | Inline embed loaded on initial render | Lazy-load on CTA click, or dedicated `/boeken` route |
| Cal.com / Calendly | Default timezone is admin's machine, not `Europe/Amsterdam` | Set event-type timezone explicitly to `Europe/Amsterdam`; test DST transitions |
| Google Meet auto-create | Conferencing toggle off per event-type | Verify per event-type in Cal.com/Calendly settings; end-to-end test booking |
| Google Calendar API | OAuth token expires silently | Monitor integration health page during first 90 days; alerting on first failure |
| Resend / Postmark / SES | Domain not verified → mail sent from shared domain (spammy) | Verify domain with SPF + DKIM + DMARC before first form submission |
| Gmail/Outlook deliverability | `noreply@` from-address triggers spam scoring | Use `info@` or `contact@` real address; Reply-To set correctly |
| Cookieless analytics (Plausible/Fathom/Umami) | Self-hosted Umami without proper headers leaks PII | Use hosted Plausible/Fathom or carefully configure self-hosted Umami; document in privacy policy |
| Google Search Console | Forgotten property verification after domain change | Verify both `www` and root, set preferred domain via canonical |
| Google Business Profile | Unclaimed listing exists at incorrect address | Claim listing in Phase 5; verify NAP matches site exactly |
| Instagram | Bio link doesn't match canonical site URL | Use exact canonical URL (HTTPS, trailing slash policy) in Instagram bio |
| Custom domain DNS | TTL too high blocks emergency DNS changes | Set TTL to 300s before launch; raise to 3600s once stable |
| Image CDN (Cloudinary/imgix) | Different image URL per visit kills browser cache | Stable URLs per image variant; cache headers set explicitly |
| Figma → code | Pixel-perfect but missing semantic structure | Figma frames are visual reference, not structural truth; HTML semantics drive markup |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Web fonts blocking render | LCP > 2.5s, FOIT on hero text | Self-host, preload primary weight, `font-display: swap` | Any traffic on slow mobile |
| Hero image not preloaded | LCP element identified as hero image, slow | `<link rel="preload" as="image" fetchpriority="high">`; never `loading="lazy"` on hero | First paint on cold-cache mobile visit |
| Third-party booking widget on initial load | INP > 500ms, TBT > 600ms | Lazy-load on CTA click | First load of every cold visit |
| Decorative GSAP/Framer animation in hero | CLS spike, INP regression on scroll | CSS animation where possible; respect `prefers-reduced-motion`; reserve space | Any user with slower device or reduced motion |
| Image dimensions missing | CLS > 0.1, layout shift on image load | Always set `width` and `height` (or `aspect-ratio` CSS) | Every image, every load |
| Unbundled / un-minified production build | TTFB + LCP bloat | Production build with minification, tree-shaking; verify bundle size budget | All visits, all the time |
| Hydration of static content | INP regression with no functional gain | Use Astro islands or SvelteKit `csr=false` for static sections | Pages with mostly static content + small interactive parts |
| Render-blocking third-party scripts (chat widgets, pixels) | Performance score drops 20+ points | Defer non-critical scripts; load on interaction; consider Partytown for analytics | Any third-party script added |
| GA4 / TCF banner JS | INP regression, bundle bloat | Cookieless analytics if possible; otherwise lazy-load TCF | Every visit with consent banner |
| Long Tasks (>50ms) in click handlers | INP > 200ms | Break tasks with `scheduler.yield()` or `setTimeout(0)` | Booking form submit, complex interactions |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Free-text intake field with no warning | PHI / special-category data collected without legal basis | Visible warning above field: "Deel hier alleen wat veilig voelt"; intake done in session, not on form |
| Form endpoint without rate-limiting | Spam floods practitioner's inbox; potential DoS | Server-side rate limit (e.g., 5 submissions per IP per hour); CAPTCHA only if needed (impacts UX + AVG) |
| Honeypot field missing | Bot spam submissions | Add hidden `<input>` field; reject submission if filled |
| Practitioner email exposed as plaintext in HTML | Email harvesting → spam | Use `mailto:` (acceptable trade-off for transparency in this niche) OR obfuscate with JS reveal-on-click |
| No CSRF protection on form | Form submission forgery | SvelteKit/Next.js form actions include CSRF by default — verify enabled |
| Server logs IP indefinitely | AVG retention violation | Rotate logs; document retention in privacy policy; consider stripping IP on form endpoints |
| HTTPS without HSTS | Downgrade attack risk | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header |
| Mixed content (HTTP image on HTTPS page) | Browser warning, SEO hit | Audit all asset URLs; CSP `upgrade-insecure-requests` |
| Open redirect on form `?next=` param | Phishing vector | Whitelist allowed redirect targets |
| Booking iframe without `referrerpolicy` | Referrer leakage to third party | Set `referrerpolicy="strict-origin-when-cross-origin"` |
| Practitioner's calendar API token stored in client-side env | Token exfiltration | Server-side only; `.env.local` not committed; rotate if leaked |
| No CSP header | XSS attack surface | CSP with explicit `script-src` allowlist; report-only mode first to find violations |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Booking form requires account creation | Cold-traffic conversion drop | Anonymous booking flow (per PROJECT.md Out of Scope: no accounts) |
| Calendar showing only current week | Bookings forced into earliest slot, no planning ahead | Show next 4 weeks of availability |
| No timezone display on booking | Confusion for any visitor not in CET | Display "Tijden in Nederlandse tijd (CET/CEST)" near calendar |
| Form errors only inline at submit | Re-fill frustration | Real-time validation + inline error messages with accessible `aria-describedby` |
| "Boeken" button leads to long form | Drop-off before completion | Two-step: pick date/time first (low commitment), enter details second |
| Trigger-heavy content without warning | Trauma re-activation; user closes tab | Visible trigger warnings on trauma-discussion sections |
| Accordion FAQ collapsed by default with no expand-all | AI/SEO crawler still sees content (rendered) but humans miss high-value answers | Open the most important FAQ by default; show "Bekijk alles" CTA |
| "Welcoming both initiated and uninitiated" lost to jargon | Cold traffic bounces, doesn't understand the modality | Define every wellness term on first use; glossary near footer |
| No clear "wat te verwachten" content | Trust barrier; uninitiated visitor doesn't know what a session looks like | Section: "Wat gebeurt er in een sessie? — 30 min uitleg + 60 min werk in een veilige setting" |
| Practitioner photo missing or stock-photo | Trust gap for health niche | Real practitioner photo (warm, professional, not corporate) |
| Mobile CTAs below the fold on common viewports | Conversion drop on iPhone SE / older Android | Test on 360px width; primary CTA visible above fold |
| Phone link not click-to-call on mobile | Friction copying number | `<a href="tel:+31201234567">` — already in requirements |
| Email link without `mailto:` | Friction opening mail client | `mailto:` link with optional subject prefill |
| Form success state shows only "Bedankt" | User doesn't know what happens next | "Bedankt, ik neem binnen 2 werkdagen contact op via [email]. Geen reactie ontvangen? Check je spamfolder." |
| No save-progress on multi-step form | Lost work on accidental refresh | Single-step form OR localStorage persistence |
| Trauma-related copy without grounding language | Activation without containment | Pair every trauma reference with a grounding cue ("voel je voeten op de grond...") |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Landing page hero:** content visible in browser — but is it in initial HTML? Verify with `curl -A "OAI-SearchBot" <url> | grep -A2 '<h1'`
- [ ] **Meta tags:** present in DOM — but in initial HTML? Verify with View Source (not DevTools).
- [ ] **FAQ section:** accordion works — but does FAQPage JSON-LD exist? Verify with Rich Results Test.
- [ ] **Hero image:** displays beautifully — but is it preloaded? Lighthouse "LCP image was lazily loaded" warning check.
- [ ] **Contact form:** submits successfully — but does the email actually arrive in practitioner's inbox (not spam)? End-to-end test from Gmail/Outlook.
- [ ] **Booking flow:** confirmation appears — but is Google Meet link in the email? Verify in confirmation.
- [ ] **Booking flow:** time displayed — but in `Europe/Amsterdam`? Test across DST transitions (book in October and March).
- [ ] **robots.txt:** allows AI crawlers — but no wildcard Disallow above the allows? Validate with robots.txt tester.
- [ ] **Sitemap:** generated — but submitted in Search Console and contains only 200-status URLs?
- [ ] **Canonical tag:** present — but pointing to correct domain (HTTPS, www-or-root consistent)?
- [ ] **JSON-LD Organization:** present — but `sameAs` filled with social URLs and `LocalBusiness` matches footer NAP?
- [ ] **Privacy policy:** linked from form — but lists ALL processors (booking, email, analytics, hosting)?
- [ ] **Consent checkbox:** present on form — but unchecked by default and form actually rejects submission if unchecked?
- [ ] **Cookie banner:** decision made (cookieless or TCF) — but if TCF, denied-by-default and analytics actually blocked until consent?
- [ ] **NAP consistency:** site footer correct — but Instagram bio, Google Business Profile, KvK all match exactly?
- [ ] **E-E-A-T:** "Over" section exists — but practitioner credentials specific (not "ervaren begeleider" but "8 jaar praktijk, opgeleid bij [school]")?
- [ ] **Testimonials:** displayed — but written consent on file for each, and no diagnosis language ("PTSS", "burn-out")?
- [ ] **Hedge language:** copy reads gently — but scanned for "misschien", "zou kunnen", "wellicht" and replaced with two-sentence pattern?
- [ ] **Disclaimer:** present somewhere — but visible near booking CTA, not buried in footer fine print only?
- [ ] **Trigger warning:** trauma content present — but warning visible before the content, not after?
- [ ] **Hreflang:** infrastructure ready — but `nl-NL` emitted correctly and `x-default` aligned for future EN?
- [ ] **Web fonts:** look correct in Figma — but self-hosted, preloaded, with `font-display: swap`?
- [ ] **Images:** look sharp — but `width`/`height` attributes set on every `<img>` to prevent CLS?
- [ ] **Mobile responsive:** looks right on Chrome DevTools — but tested on real mid-range Android with throttled 4G?
- [ ] **Lighthouse score:** desktop 100 — but mobile? Mobile is the score that matters.
- [ ] **Search Console:** site verified — but sitemap submitted, Core Web Vitals report accessible, mobile usability checked?

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Site shipped with CSR, no SSR | HIGH | Framework migration or per-route prerender; expect 1-2 weeks dev + 2-4 weeks reindex |
| AI crawlers blocked in robots.txt | LOW | Fix robots.txt; resubmit sitemap; allow 1-4 weeks for AI engines to recrawl |
| Unsubstantiated medical claim went live | MEDIUM | Take down or rewrite immediately; document the change; if Reclame Code complaint filed, respond within their timeline |
| Form emails landing in spam | LOW | Add SPF/DKIM/DMARC; warm up sender domain; export missed submissions from server logs if possible |
| Google Meet link missing from confirmations | LOW | Fix in Cal.com/Calendly; manually email affected bookings with Meet link |
| Cookie consent missing → AVG complaint | MEDIUM | Implement TCF banner or move to cookieless analytics; document the change; respond to Autoriteit Persoonsgegevens within their timeline |
| Testimonial published without consent | MEDIUM | Remove immediately; obtain retroactive consent or leave removed; document removal |
| Canonical pointing wrong | LOW | Fix canonical; update sitemap; expect 1-2 weeks reindex |
| Hreflang broken after EN launch | MEDIUM | Fix symmetry; submit fixed sitemap; expect 2-4 weeks for SERP recovery |
| Core Web Vitals regression on launch | MEDIUM | Identify worst metric in CrUX; fix highest-impact issue first (typically LCP image preload or web font); revalidate in 28 days |
| NAP inconsistency across web | MEDIUM | Update each off-site source to canonical NAP; let entity-recognition catch up over 4-12 weeks |
| FAQ JSON-LD missing | LOW | Add JSON-LD; submit URL for reindex in Search Console |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. CSR blinds AI crawlers | Phase 0 (framework lock) + Phase 1 (every route) | `curl -A "OAI-SearchBot" <url>` shows H1 + content |
| 2. robots.txt wildcard disallow | Phase 1 (initial deploy) | robots.txt validator; server logs show AI-crawler hits within 30 days |
| 3. Unsubstantiated health claims | Phase 2 (content) + Phase 5 (legal review) | Practitioner sign-off; legal review by Dutch counsel pre-launch |
| 4. Hedge language kills citations | Phase 2 (content guide) | Grep for hedge words; Perplexity citation test 60-90 days post-launch |
| 5. SEO/AEO as afterthought | Phase 0 (architecture) + every phase | PR template SEO checklist; Lighthouse SEO 100 gate per section |
| 6. JS-injected meta / lazy hero | Phase 1 (hero build) | View Source check; Lighthouse LCP audit |
| 7. GDPR / AVG violations on forms | Phase 3 (forms) + Phase 5 (legal) | Consent checkbox required; privacy policy reviewed by counsel |
| 8. Booking widget destroys CWV | Phase 4 (booking) | Lighthouse Performance ≥ 90 mobile after integration |
| 9. Form emails in spam | Phase 3 (forms) | End-to-end test from Gmail/Outlook/iCloud before launch |
| 10. Google Meet missing | Phase 4 (booking) | Test booking includes Meet link in confirmation |
| 11. Testimonials without consent | Phase 2 (content) | Written consent on file per testimonial; no diagnosis language |
| 12. NAP / entity inconsistency | Phase 2 (content) + Phase 5 (off-site audit) | NAP-block source-of-truth doc; off-site audit checklist passed |
| 13. FAQ without JSON-LD | Phase 2 (FAQ build) | Rich Results Test passes |
| 14. SPA deeplink 404s | Phase 1 + each route-adding phase | `curl -I` on every public route returns 200 |
| 15. Canonical mistakes | Phase 1 (scaffolding) | Lighthouse + view-source check on every route |
| 16. Sitemap / robots mismatch | Phase 1 + every build | Sitemap auto-generated; Search Console reports 0 "blocked by robots" |
| 17. Hreflang errors | Phase 1 (architecture-ready) + future locale phase | Hreflang validator before each locale launch |
| 18. CWV regression — fonts/animation | Phase 1 (fonts) + each animation phase | Lighthouse mobile ≥ 90; CrUX field data post-launch |
| 19. No author / E-E-A-T fail | Phase 2 (Over section) | Visible "Over" section + Person JSON-LD valid |
| 20. Granularity bias | Phase 0 (define gates) + every phase | DoD checklist per section; Lighthouse score flat across phases |

---

## Sources

- **Project reference document:** `seo-aeo-samenvatting-checklist.md` (project root) — Dutch-language SEO/AEO playbook with verified 2026 sources covering AI-crawler robots.txt behavior, citation-lift research (KDD 2024 GEO study, +30–41%), recency effects, entity consistency, and explicit confirmation that `llms.txt` has no proven retrieval effect.
- **Aggarwal et al., GEO: Generative Engine Optimization** — Princeton/Georgia Tech/Allen AI/IIT Delhi, ACM KDD 2024 (arXiv:2311.09735). Source for the statistics/quotes/citations citation lift cited in Pitfalls 4 and 19.
- **HubSpot AI Search Trends 2025** — recency effect on AI citations (~3× lift for content updated within 3 months).
- **AI-crawler/robots.txt references (2026):** Anagram, CapstonAI, Citevera, No Hacks — distinguishing search/RAG crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-User, ClaudeBot) from training crawlers (Google-Extended, Applebot-Extended); confirms `llms.txt` not honored.
- **Google Search Quality Evaluator Guidelines** — E-E-A-T framework, especially YMYL (Your Money Your Life) treatment for health-adjacent content (Pitfall 19).
- **Google robots.txt specification** — user-agent specificity rules (Pitfall 2).
- **web.dev Core Web Vitals documentation** — LCP, INP, CLS thresholds and optimization patterns (Pitfalls 6, 8, 18).
- **Cal.com and Calendly integration documentation** — embed modes, conferencing setup, OAuth scopes (Pitfalls 8, 10).
- **Gmail Sender Guidelines (Feb 2024)** — SPF + DKIM + DMARC requirements (Pitfall 9).
- **Nederlandse Reclame Code (reclamecode.nl) and NVWA guidance** — Dutch advertising regulation for health-adjacent claims (Pitfall 3, 11). **NOTE: MEDIUM CONFIDENCE — flagged for Dutch legal counsel review before launch.**
- **AVG (Algemene Verordening Gegevensbescherming)** — Dutch GDPR implementation; Autoriteit Persoonsgegevens guidance; Art. 9 special category data (Pitfalls 7, 11). **NOTE: General principles HIGH confidence; product-specific application MEDIUM — flagged for Dutch legal counsel review before launch.**
- **ePrivacy Directive** — cookie consent requirements; cookieless analytics no-banner pattern (Pitfall 7, confirmed by Plausible/Fathom legal write-ups).
- **Google Calendar API conferenceData v2 documentation** — Google Meet auto-generation (Pitfall 10).

> **Live-verification caveat:** This research round had WebSearch and external tool access denied. Findings rely on (a) the project's own verified reference document, (b) Claude training, (c) cross-checks against well-established industry guidance. Legal/regulatory items (Pitfalls 3, 7, 11) are flagged MEDIUM confidence and explicitly require Dutch counsel review before launch.

---
*Pitfalls research for: Dutch-language SEO/AEO-first marketing site (wellness/breathwork niche, Holland)*
*Researched: 2026-06-14*
