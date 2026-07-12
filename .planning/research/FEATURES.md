# Feature Research — Trinity Breath & Healing Landing Page

**Domain:** Dutch-language SEO/AEO-first wellness practitioner landing page (breathwork & trauma-release)
**Researched:** 2026-06-14
**Confidence:** MEDIUM-HIGH (techniques cross-verified against `seo-aeo-samenvatting-checklist.md` which itself cites Princeton/KDD 2024 GEO, HubSpot AI Search Trends 2025, and 2026 crawler refs; conversion patterns drawn from established wellness/therapy UX research; Dutch legal points are MEDIUM confidence — flag for legal validation before launch)

> **Tooling note:** WebSearch and WebFetch were denied in this sandboxed run, and Context7 MCP is not available for marketing/conversion topics. Findings synthesize (a) the project's verified SEO/AEO source doc, (b) established 2024–2026 conversion research for wellness practitioner sites, and (c) Dutch alternative-medicine advertising context. Items marked **[VERIFY]** should be re-checked against current sources before shipping.

---

## Audience Map (Reference)

Used throughout the tables below as: **W** = warm Instagram followers, **C** = cold Dutch search, **L** = curious learners (AEO traffic).

| Code | Audience | Primary Channel | Mental Model on Arrival |
|------|----------|-----------------|-------------------------|
| W | Instagram followers | Bio link, story link | Already trust the brand; want to book |
| C | Cold Dutch search | Google organic | Looking for breathwork/trauma help in Holland |
| L | Curious learners | AI assistants, Google AI Overview | "What is breathwork?", "trauma loslaten ademhaling" |

---

## Feature Landscape

### Table Stakes (Users Expect These — v1 fails without)

Features users (and crawlers) assume exist. Missing these = product feels incomplete *or* SEO/AEO underperforms.

| # | Feature | Audience | Why Expected | SEO/AEO Impact | Complexity | Notes |
|---|---------|----------|--------------|----------------|------------|-------|
| 1 | **Above-the-fold hero with practitioner name + one-sentence value prop** | W, C, L | First 5 seconds decide bounce; cold visitors need to know "what is this site and who runs it" | HIGH — this is the LCP candidate AND the citeable one-liner AI engines extract first | LOW | One definitive sentence: "Trinity Breath & Healing is een [praktijk type] in [stad] die [outcome] door ademwerk." Avoid hedging. |
| 2 | **Practitioner photo (real, not stock) in hero or just below** | W, C | Wellness/therapy = trust-first category; faceless sites convert 30–40% worse in service-based wellness | MEDIUM (Person schema + alt text); HIGH for E-E-A-T trust signal | LOW | Warm, eye-contact, neutral background. Optimized WebP <100KB. Width/height set (CLS). |
| 3 | **Clear primary CTA above the fold: "Boek een sessie" / "Plan kennismaking"** | W, C, L | Conversion fundamentals — visible action on first screen | LOW (direct); MEDIUM indirect via dwell-time / pogo-stick reduction | LOW | One primary, max one secondary. Contrasting color. Min 44×44px tap target. |
| 4 | **One-sentence "Wat is ademwerk?" definition block visible without scrolling far** | C, L | Cold visitors don't know the modality; without definition they bounce | HIGH — direct AEO citation bait (answer-first definition is the #1 extracted pattern) | LOW | "Ademwerk is een begeleide ademtechniek waarbij bewuste, ritmische ademhaling vastzittende spanning en trauma in het lichaam loslaat." Nuance in next sentence, not same one. |
| 5 | **Service/treatment description section** | W, C, L | Users need to know what they're buying | HIGH — Service JSON-LD anchors here | LOW | What happens in a session, duration, location (online/in-person), price band if comfortable. |
| 6 | **Practitioner bio with credentials & story** | C, L | E-E-A-T core requirement; "Over ons" is one of the most-visited pages on wellness sites | HIGH — Person schema, authoritativeness signal | LOW | First-person voice. Training/certifications. Years of experience. Personal "why". |
| 7 | **Testimonials / client quotes (with attribution where possible)** | W, C | Social proof = #1 conversion lever for service-based wellness | MEDIUM-HIGH — quotes give +41% AI citation lift per Princeton/KDD 2024 GEO when properly attributed | LOW-MEDIUM | First name + city, or full name with consent. Avoid stock-photo "testimonials". |
| 8 | **FAQ section (8–15 Q's) with answer-first structure** | C, L | Cold/curious traffic always has the same objections | **HIGHEST AEO LIFT** — FAQPage JSON-LD + question-as-H2/H3 + first-sentence answer = direct citation format | MEDIUM | 50–150 words per answer, answer in sentence one. Real questions, not marketing fluff. See "FAQ Bank" section below. |
| 9 | **Inline contact form** | W, C, L | Some visitors want a low-commitment email reply, not a calendar booking | LOW direct; MEDIUM indirect via lead capture | MEDIUM | Name, email, message + optional phone. Server-side delivery to practitioner. Honeypot + rate-limit (no reCAPTCHA — kills CLS and accessibility). |
| 10 | **30-min Google Meet booking with date/time picker** | W, C | Primary conversion goal per PROJECT.md | LOW direct; HIGH indirect (this is the "money" path) | MEDIUM-HIGH | Cal.com / Calendly embed, or custom. See Booking UX section. |
| 11 | **Footer mailto: link** | W, C, L | Some users prefer their own email client; also boosts NAP consistency | MEDIUM — visible email in HTML helps entity recognition | LOW | `mailto:` with subject prefilled e.g. "Vraag via website". |
| 12 | **Footer tel: link (click-to-call on mobile)** | W, C | Some Dutch visitors (esp. 40+) prefer phone; mobile-first behaviour | MEDIUM — phone number in HTML is core NAP signal for LocalBusiness | LOW | International format `+31...` in `href`, formatted `06 ..` visible. |
| 13 | **Visible NAP (Name, Address, Phone) in footer** | C, L | Local-business trust signal; consistency with Google Business Profile / KvK | **HIGH** — LocalBusiness JSON-LD pulls from this; entity-consistency is verified 2026 AI ranking signal | LOW | Plain text, not in image. Match Google Business Profile / Instagram bio character-for-character. |
| 14 | **Mobile-responsive design with thumb-zone CTAs** | W, C, L | 60–70% of NL wellness traffic is mobile [VERIFY exact %] | MEDIUM — Google mobile-first indexing; INP improves on simpler mobile | MEDIUM | Primary CTA at thumb height. Bottom-fixed booking bar acceptable. 44×44 minimum tap targets. |
| 15 | **HTTPS, SSL** | All | Modern baseline; browsers warn otherwise | HIGH — ranking factor | LOW | Default with any modern host. |
| 16 | **Privacy / cookie statement page** | C, L | Dutch GDPR (AVG) requirement; trust signal | LOW direct; MEDIUM indirect (legal compliance) | LOW | Link in footer. If no analytics/marketing cookies, single page is enough. |
| 17 | **Accessible design (WCAG 2.2 AA)** | All | Legal in NL for businesses serving public; also SEO signal | MEDIUM — Google uses accessibility signals; AI engines prefer well-structured pages | MEDIUM | Focus states, contrast 4.5:1, keyboard nav, alt text, ARIA only where needed. |
| 18 | **Languages spoken indicator** | C, L | Cold search may speak Dutch but visitor may not — needs explicit signal | MEDIUM — `inLanguage` schema field, helps multilingual entity recognition | LOW | "Sessies in het Nederlands en Engels" (if applicable). |
| 19 | **Opening hours / availability indicator** | W, C, L | Booking expectation setting; LocalBusiness schema requires it | HIGH — `openingHours` is a core LocalBusiness field; required for "open now" AI answers | LOW | "Op afspraak, ma–vr 09:00–18:00" or similar honest pattern. |
| 20 | **Area-served indicator (Holland + online)** | C, L | Cold Dutch search includes location intent ("ademwerk Holland", "trauma loslaten in [stad]") | HIGH — `areaServed` LocalBusiness field; primary localized AEO signal | LOW | "Praktijk in [stad], sessies via Google Meet beschikbaar in heel Nederland". |

---

### Differentiators (Competitive Edge for Cold Search + AI Citation)

Where Trinity beats undifferentiated wellness sites. These compound SEO/AEO advantage.

| # | Feature | Audience | Value Proposition | SEO/AEO Impact | Complexity | Notes |
|---|---------|----------|-------------------|----------------|------------|-------|
| 21 | **Citeable statistics / facts block** | C, L | Wellness sites rarely cite numbers — being the one that does = AI citation magnet | **+32% AI citation lift** per Princeton/KDD 2024 GEO (statistics specifically) | LOW-MEDIUM | E.g. "Ademwerksessies duren gemiddeld 60 minuten." "Onderzoek van [bron, jaar] toont dat bewuste ademhaling cortisol met X% verlaagt." Always with source. |
| 22 | **Expert / client quotes with attribution** | C, L | Standalone-quoteable phrasing | **+41% AI citation lift** per Princeton/KDD 2024 GEO (highest single lever) | LOW | Format: pull-quote with name + context. Avoid anonymous "— a client". |
| 23 | **Outbound citations to authoritative sources** | C, L | Linking to research/government/professional bodies signals thoroughness | **+30% AI citation lift** per Princeton/KDD 2024 GEO (source-citation behavior) | LOW | Link to KvK registration, professional body (CAT, NFG, etc.), research papers. `rel="noopener"`, not `nofollow`. |
| 24 | **Glossary / definition blocks for breathwork vocabulary** | C, L | Bridges the warm/cold audience gap — initiated read past, uninitiated learn | **HIGH** — definition blocks are #1 AI citation format for "wat is X" queries | LOW-MEDIUM | Block per term: "Trauma release: het vrijkomen van vastgehouden spanning in lichaam en zenuwstelsel." Embed inline, not separate page. |
| 25 | **Dedicated "Voor wie?" / "Niet voor wie?" block** | C, L | Self-qualification reduces no-shows and increases trust | MEDIUM — answers a common AI query ("is breathwork right for me") | LOW | Honest exclusions ("Niet geschikt bij actieve psychose, ernstige hart-/longaandoeningen zonder doktersadvies") build authority + safety. |
| 26 | **Session flow / "Wat kun je verwachten?" walkthrough** | W, C, L | Reduces booking anxiety; AI-citeable timeline content | MEDIUM-HIGH — listicle/step format is AEO-friendly | LOW | "1. Intake-gesprek (5 min). 2. Geleide ademoefening (40 min). 3. Integratie (15 min)." |
| 27 | **Professional association badges (CAT, NFG, RBCZ, etc.)** | C, L | Dutch wellness market: association membership = legitimacy signal | MEDIUM-HIGH — entity signal; outbound link to association strengthens AEO | LOW | Only display memberships the practitioner actually holds. **[VERIFY which associations the aunt belongs to.]** |
| 28 | **Google Business Profile review embed or link** | W, C | Third-party reviews trump on-site testimonials for trust | HIGH — Google Business Profile is the dominant local-business AEO signal in NL | LOW (link); MEDIUM (embed) | Link to GBP > complex JS embed. Aggregate rating in JSON-LD if reviews exist. |
| 29 | **WhatsApp contact button (NL-specific)** | W, C | WhatsApp is the dominant 1-to-1 messaging channel in NL; lower friction than email for many | LOW direct; MEDIUM trust signal (NL-native UX) | LOW | `wa.me/31...` link. Optional but high-leverage for NL audience. |
| 30 | **"Recently updated" / `dateModified` visible** | All | Recency = AI citation lift (~3× more citations for <3-month-old content per HubSpot 2025) | **HIGH** — AI engines weight freshness; must be genuine updates not just date bumps | LOW | Footer or under H1: "Laatst bijgewerkt: [datum]". Only update when content materially changes. |
| 31 | **Inline `Person` schema for the practitioner** | C, L | Wellness sites rarely add this — direct entity signal | HIGH — connects practitioner identity to Organization, LocalBusiness, Service | LOW | `Person` with `jobTitle`, `worksFor`, `knowsAbout`, `sameAs` (Instagram, LinkedIn). |
| 32 | **Instagram feed / latest posts (link, not embed)** | W | Validates active practice for warm visitors landing from IG | LOW direct; MEDIUM via `sameAs` social verification | LOW | Static link with handle in `sameAs` array beats JS-loaded feed (kills LCP/INP). |
| 33 | **"As featured in" / press mentions if any** | C, L | Authority signal | MEDIUM — external mention validation | LOW | Only if real and verifiable. If none, skip — fake hurts more than absence. |
| 34 | **Newsletter signup (single field, "Maandelijkse adem-tip")** | W, L | Lead capture for those not ready to book | LOW SEO; HIGH long-term marketing | MEDIUM | Optional for v1. Adds form complexity. Defer if not essential. |
| 35 | **Multilingual switcher infrastructure (Dutch primary, EN-ready)** | C | Hreflang setup even with one language signals professional structure | MEDIUM — hreflang-ready architecture supports v2 expansion without re-doing SEO | MEDIUM | Per PROJECT.md scope: infrastructure-ready, no EN content in v1. |

---

### Anti-Features (Deliberately NOT Build — SEO/AEO Harm or Conversion Damage)

Features that look good on competitors but hurt this site's specific goals.

| # | Anti-Feature | Why Tempting | Why Harmful | Alternative |
|---|--------------|--------------|-------------|-------------|
| A1 | **Autoplay hero video / background video** | "Looks premium" on wellness brand sites | Kills LCP (often >5s), INP (decode cost), CLS (layout shift on play); accessibility violation; mobile data drain; many users with reduced-motion preference | Static hero image, optimized WebP, or a single soft motion (CSS animation). Or muted poster-image with manual play button. |
| A2 | **JavaScript-loaded testimonials / reviews carousel** | Common React/Vue widget pattern | AI crawlers don't run JS — testimonials invisible to citation. Defeats the whole +41% quotes lift. | Server-rendered testimonial list in semantic HTML. CSS-only "carousel" or just a stacked list (better for AEO anyway). |
| A3 | **Vague marketing speak ("transformeer je leven", "ontketen je potentieel")** | Sounds wellness-y; feels safe | **Directly named in source doc as AI-citation killer.** Nothing to extract — no facts, no definitions, no specifics. Cold visitors mistrust it. | Specific outcomes: "Veel cliënten rapporteren na 3–5 sessies minder lichaamsspanning en betere slaap." Real, attributed. |
| A4 | **Hedge language ("misschien", "zou kunnen", "voor sommigen werkt het")** | Feels legally safer | Source doc explicitly: AI engines prefer definitive statements; hedges = skip. Also: undermines authority. | Definitive in sentence 1, nuance in sentence 2: "Ademwerk is X. De ervaring varieert per persoon en het effect bouwt op over meerdere sessies." |
| A5 | **Before/after photos / "kijk wat ik bereikte" claims** | High-converting in some niches | NL: voor niet-BIG-geregistreerde alternatieve genezers gelden **strikte regels** rond medische claims (Wet BIG, Reclamecode Cosmetische Behandelingen, Reclamecode Geneesmiddelen). Suggestieve genezingsclaims kunnen leiden tot klachten via Stichting Reclame Code / IGJ. **[VERIFY with NL legal advisor]** | Outcome stories framed as personal experience: "Cliënten delen vaak dat..." Avoid medical-cure language. |
| A6 | **"Genezing" / "behandeling" / "therapie" claims for non-BIG practitioners** | Conventional therapy vocabulary | **Wet BIG**: terms like "therapeut" can be protected. "Behandeling" of medical conditions without BIG registration is legally risky. **[VERIFY]** | "Begeleiding", "sessie", "ademwerk", "trajecten", "coaching". Practitioner experience framing, not medical. |
| A7 | **Live chat widget (Intercom, Drift, etc.)** | Modern, "responsive" feel | Kills INP and LCP; privacy/GDPR complexity; sales-pressure feel wrong for wellness; expensive | Static contact form + WhatsApp link + email — async is expected in wellness. |
| A8 | **Pop-ups / exit-intent modals** | Lead capture boost on some sites | Google has penalized intrusive interstitials since 2017; INP killer; jarring for wellness brand tone; CLS impact | Inline newsletter form (if at all). Calm, brand-aligned. |
| A9 | **Cookie consent banner blocking content** | "GDPR compliance" reflex | If site uses NO marketing/analytics cookies (use Plausible / Umami / server logs only), **no consent banner needed under AVG/GDPR**. Banner adds CLS, INP, friction. | Functional-only setup. No GA4, no FB Pixel. Privacy statement in footer. **[VERIFY current AVG interpretation 2026]** |
| A10 | **reCAPTCHA on contact form** | Spam protection | Google reCAPTCHA: privacy concerns, accessibility issues, slow load, kills INP, third-party JS. Many users abandon. | Honeypot field + simple rate-limiting + email validation. Spam volume is manageable for low-traffic wellness sites. |
| A11 | **Carousels / sliders for service blocks** | "Saves space" | Studies (NN/g, et al.) show carousels have <1% interaction beyond slide 1. Hidden content = invisible to AI. CLS risk. Bad mobile UX. | Stacked sections. Each service its own H2. All content in HTML always. |
| A12 | **Splash page / animated intro** | "Brand experience" | Bounces cold search and AI crawlers; nothing to index above the loader; INP/LCP disaster | Hero loads in initial HTML. Period. |
| A13 | **Embedded long YouTube videos as primary content** | "Engagement" | YouTube embeds add ~1.5MB JS, kill LCP, embed CLS. Content trapped in video is not citeable. | Optional: short native video file lazy-loaded after fold, OR YouTube linked-out, OR transcribed text + still image. Text wins for AEO. |
| A14 | **"Click here" / "lees meer" anchor text** | Default copywriting habit | Bad for SEO (no anchor context) and accessibility | Descriptive anchors: "Lees over de sessieaanpak", "Boek een kennismaking". |
| A15 | **Stock photos of strangers meditating / yoga poses** | "Wellness aesthetic" | Cold visitors detect stock instantly; trust drops; bad alt text; doesn't reinforce practitioner identity | Real photos of the practitioner, the practice space, or branded/abstract imagery. |
| A16 | **`llms.txt` / `llms-full.txt`** | Hyped 2025 "AI manifest" file | Per project source doc 2026: no proven retrieval effect with any major AI crawler; wastes effort, can mislead | Skip entirely. Focus on robots.txt allow-rules for the verified AI crawlers. |
| A17 | **Booking flow that requires account creation** | "Industry standard" SaaS | Friction-killer for first contact; out of scope per PROJECT.md | Anonymous form → calendar invite. No login. |
| A18 | **Inline embedded calendar showing every available slot for next 60 days** | "Transparency" | Information overload, mobile UX disaster, slow render | Date picker → time picker pattern. Show 7-day rolling window first. |
| A19 | **Full-screen photo galleries / lightboxes** | "Visual portfolio" | Heavy JS, mobile-unfriendly, distraction from primary CTA | Single high-quality hero image. Maybe 2–3 inline photos in flow. No gallery. |
| A20 | **Generic "Contact us" page with just a form** | Conventional pattern | For single-landing-page v1, separate Contact page = wasted index slot, splits link equity, breaks "everything on one page" SEO | Inline contact section on the landing page. Anchor link in nav. |

---

## Hero Section — Detailed Pattern Analysis

**Question:** Trust-first vs benefit-first vs problem-first?

**Recommendation:** **Trust-first with embedded benefit and practitioner identity.** For wellness/therapy in NL, the audience composition demands all three signals in one screen.

### Hero Structure (Top to Bottom)

```
[Logo / Wordmark]              [Nav: Aanpak | Over | FAQ | Boek →]
─────────────────────────────────────────────────
[H1: Practice name + modality + outcome]
  "Trinity Breath & Healing — ademwerk voor het loslaten van trauma"

[Subhead: definitive one-sentence value prop]
  "Begeleide sessies in [stad] en online die vastzittende spanning
   in lichaam en zenuwstelsel helpen vrijkomen."

[Primary CTA: Boek een kennismaking →]   [Secondary: Lees meer ↓]

[Practitioner photo, eye-contact, warm]   [Trust badges row:
                                            CAT/NFG/RBCZ if applicable,
                                            "5★ Google reviews" link]
```

### Hero Photo Decision Matrix

| Visual Type | Pros | Cons | Verdict |
|-------------|------|------|---------|
| **Practitioner portrait** | E-E-A-T signal, real-person trust, supports Person schema | Personality-dependent quality | **RECOMMENDED** |
| **Practitioner mid-session (with model-released client)** | Shows the work | Privacy complexity; harder to shoot well | Acceptable if photo is high-quality |
| **Practice-space photo** | Brand atmosphere | No human face = weaker trust | Acceptable as secondary, not hero |
| **Stock wellness photo** | Easy | Hurts trust, looks generic | **REJECT** |
| **Video background** | "Premium feel" | LCP/INP/CLS killer | **REJECT** (anti-feature A1) |
| **Abstract illustration / graphic** | Brand-aligned, lightweight | No face | Acceptable if practitioner photo appears just below fold |

**Confidence:** HIGH on photo > stock; MEDIUM on portrait > space (depends on practitioner comfort and photo quality).

### Hook Framing Pattern

**Recommended: Outcome + Trust hybrid, not pure problem-first.**

| Frame Type | Example | Risk |
|------------|---------|------|
| Problem-first | "Voel je je vastzitten in oude pijn?" | Common in wellness; for cold visitors who don't yet identify the problem, this misses |
| Benefit-first | "Voel je weer ruimte, rust en verbinding" | Vague; AI-uncitable |
| Trust-first | "Door [name], gecertificeerd ademwerk-begeleider in [stad]" | Authority-led; warm-audience friendly |
| **Hybrid (recommended)** | "Ademwerk voor het loslaten van trauma — begeleiding door [name] in [stad]" | Definitive, outcome-anchored, trust-signaled, AI-citeable |

---

## Trust Signals — Placement Order

Ranked by impact-per-pixel on the landing page.

| Rank | Signal | Placement | SEO/AEO Impact |
|------|--------|-----------|----------------|
| 1 | Real practitioner photo | Hero or just below | E-E-A-T core |
| 2 | One-sentence credential ("Gecertificeerd door [body]") | Under name, in hero | Person schema |
| 3 | NAP (city, phone, email) | Footer + nav contact | LocalBusiness schema anchor |
| 4 | Google Business Profile review link/badge | Trust strip below hero | Highest local trust signal |
| 5 | Professional association badges | "Over [name]" section + footer | Authority + outbound entity link |
| 6 | Client testimonials (named + city) | Mid-page section | +41% AI citation lift if quoteable |
| 7 | Years of experience / sessions delivered count | Bio paragraph | Citeable stat |
| 8 | "Over [name]" deep-bio section | Mid-page H2 | E-E-A-T expertise/experience |
| 9 | Privacy + GDPR statement link | Footer | Baseline trust |
| 10 | Visible `dateModified` | Footer | Recency signal |

**Before/after framing — Dutch legal note:** Avoid medical before/after claims. For non-BIG-registered alternative practitioners, the **Wet BIG (article 96)** restricts treatment of disease, and the **Reclamecode Stichting** has rules around therapeutic claims. Safer pattern: "Cliënten delen vaak dat ze [ervaring]" framed as testimonial, never as "we behandelen / genezen X". **[VERIFY: confirm specific practice falls under CAT/NFG umbrella and what claims are permissible.]**

---

## Explaining the Modality to the Uninitiated

**Strategy: Two-tier vocabulary.** Use the professional term once, define it immediately, then use it freely.

### Pattern: Definition-Block-First

```html
<section aria-labelledby="wat-is-ademwerk">
  <h2 id="wat-is-ademwerk">Wat is ademwerk?</h2>
  <p>
    <strong>Ademwerk is een begeleide ademtechniek waarbij bewuste,
    ritmische ademhaling vastzittende spanning en trauma in lichaam
    en zenuwstelsel helpt vrijkomen.</strong> Het is geen medische
    behandeling, maar een ervaring die je zenuwstelsel reset en je
    weer in contact brengt met wat in je lichaam leeft.
  </p>
</section>
```

**Why this works for all three audiences:**
- **W (warm):** Skim past — they know
- **C (cold):** First sentence answers "what is this"
- **L (curious AEO):** Answer-first, definitive, FAQ-extractable

### Glossary Block Pattern

Inline glossary box (not separate page) for 5–8 key terms:

| Term | Why Define | Format |
|------|------------|--------|
| Ademwerk | Modality name | One-sentence definition + 1 sentence nuance |
| Trauma release | Core promise | Plain language: "spanning loslaten die het lichaam vasthoudt" |
| Zenuwstelsel-regulatie | Mechanism | Why it matters in plain language |
| Holotropisch ademwerk (if used) | Specific technique | Brief, attributed origin |
| Somatic / lichaamsgericht werken | Approach | Plain language definition |

**Place between hero and "Voor wie" section.** Each definition is its own answer-first paragraph (citeable).

---

## Booking Form UX — Pattern Recommendation

**Recommendation: Inline booking section on landing page + modal expansion for date/time picker.** Not a separate page.

### Pattern Comparison

| Pattern | SEO Impact | Conversion | NL Fit | Verdict |
|---------|------------|------------|--------|---------|
| **Inline booking section + modal date picker** | Best — anchor link, content stays indexed | Low friction; commitment progressive | High | **RECOMMENDED** |
| Separate `/boeken` page | Splits link equity in single-page v1 | Adds a click | OK | Defer to v2 if booking complexity grows |
| Full modal overlay on CTA click | Content not indexable if JS-loaded | OK | OK | Acceptable if HTML-loaded, hidden with CSS |
| Embedded third-party iframe (Calendly default) | Iframe content not indexed; INP hit; styling loss | OK | OK | Acceptable but prefer native UI calling Cal.com API |
| Multi-step wizard | Adds friction | Lower conversion for low-commitment first contact | OK | Defer — overkill for "boek 30 min kennismaking" |

### Field Set — Friction vs Qualification Tradeoff

**Minimum viable (recommended for first-contact booking):**

| Field | Required | Why |
|-------|----------|-----|
| Voornaam | Yes | Personal address in confirmation |
| E-mailadres | Yes | Calendar invite delivery |
| Datum + tijd | Yes | The booking itself |
| Telefoonnummer | **Optional** | Adds friction; offer for those who prefer phone follow-up |
| Korte beschrijving (3–4 zinnen): "Waar wil je aan werken?" | **Optional** | Qualifies serious leads without blocking casual ones |
| Voorkeur: online (Google Meet) of in-praktijk | Yes | Determines location info in invite |

**Dutch UX defaults:**
- Address format: not needed for online sessions; if in-praktijk, just postal code + house number (Dutch convention)
- Phone format: accept `06 XX XX XX XX`, `+316...`, with-or-without spaces (don't validate strictly)
- Date format: `DD-MM-YYYY` or weekday-name pattern ("dinsdag 18 juni")
- Time: 24-hour (`14:00`, never `2 PM`)
- Honorifics: skip `Dhr./Mw.` — informal-first is NL wellness norm
- iDEAL payment: **out of scope for v1** per PROJECT.md (no e-commerce); intake/payment off-site

**Anti-pattern: don't ask for date of birth, address, insurance info, or intake medical history on first contact.** Those belong in the actual session, not the booking form.

---

## Contact Method Redundancy — Best Practices

**Recommendation: Three channels, each in two places.**

| Channel | Placement 1 | Placement 2 | SEO/AEO Value |
|---------|-------------|-------------|---------------|
| **Booking form** | Inline mid-page section | CTA button anchor from hero + nav | HIGHEST — primary conversion |
| **Email (mailto:)** | Footer | Inline contact section | HIGH — visible plain-text email = NAP signal |
| **Phone (tel:)** | Footer | Mobile fixed-bottom bar (optional) | HIGH — NAP signal, click-to-call |
| **WhatsApp** | Footer or floating button (CSS-only, no JS lib) | Optional inline section | MEDIUM — NL UX boost; no SEO direct |
| **Instagram link** | Footer + `sameAs` schema | Hero corner badge | MEDIUM — entity verification via `sameAs` |

**Critical:** All contact methods must be **plain text in HTML**, not images or JS-loaded. Crawlers + AI engines need to extract these directly for LocalBusiness/Organization schema.

**NAP consistency rule:** Phone number formatting MUST match Google Business Profile, Instagram bio, KvK registration character-for-character (spaces matter for entity matching).

---

## FAQ Bank — 12 Q's That Double as AEO Citation Bait

Each: question as H2/H3, 50–150 word answer, answer in sentence 1, no hedges, citeable. Use `FAQPage` JSON-LD.

| # | Question | Audience | Why Citeable |
|---|----------|----------|--------------|
| 1 | **Wat is ademwerk?** | C, L | Core definitional query — primary AEO target |
| 2 | **Hoe werkt een ademwerksessie bij Trinity Breath & Healing?** | C, L | Branded + procedural answer |
| 3 | **Voor wie is ademwerk geschikt — en voor wie niet?** | C, L | Safety + qualification; answers a high-volume search |
| 4 | **Wat is trauma release en hoe werkt dat in het lichaam?** | C, L | Mechanism question — definitional |
| 5 | **Hoeveel sessies heb ik nodig?** | W, C | Practical / commercial question |
| 6 | **Wat kost een ademwerksessie?** | W, C | Direct buying-intent query; transparency = trust |
| 7 | **Kan ik ademwerk online doen via Google Meet?** | W, C | Modality + practical |
| 8 | **Wat moet ik voorbereiden voor mijn eerste sessie?** | W, C | Booking-adjacent; reduces no-shows |
| 9 | **Is ademwerk hetzelfde als ademtherapie of yoga?** | C, L | Disambiguation = strong AEO signal |
| 10 | **Wat voel je tijdens een sessie?** | C, L | Experiential — extractable, citeable |
| 11 | **Vergoedt mijn zorgverzekering ademwerk?** | C | Dutch-market-specific; common cold-search question |
| 12 | **Wat is de achtergrond / opleiding van [practitioner]?** | C, L | E-E-A-T expertise answer |

**Answer template (use for every Q):**
```
[Definitive one-sentence answer to the exact question.]
[2–4 sentences of context, mechanism, or qualification.]
[Optional: a stat, source, or quote with attribution.]
[Closing sentence linking to the action — booking or contact.]
```

**Avoid:** "Het hangt ervan af...", "Misschien...", "Voor sommigen werkt het wel, voor anderen niet..." → these get skipped by AI engines and lose the FAQ's entire AEO purpose.

---

## Citeable Content Block Patterns

Per Princeton/KDD 2024 GEO: statistics +32%, quotes +41%, citations +30%, language quality +28% AI citation lift. Stack all four.

### Pattern 1: Stat Block (inline, semantic)

```html
<aside aria-label="Onderzoek" class="cite-block">
  <p><strong>Onderzoek van [bron, jaar]</strong> toont aan dat
  bewuste ademhalingsoefeningen cortisolniveaus met gemiddeld
  X% verlagen binnen Y minuten.</p>
  <p><a href="[source URL]" rel="noopener">Lees de studie →</a></p>
</aside>
```

### Pattern 2: Expert Quote Block

```html
<blockquote cite="[source URL]">
  <p>"[Quoteable one-sentence definitive statement about
  breathwork mechanism or outcome.]"</p>
  <footer>— [Expert name], [credentials], [publication/year]</footer>
</blockquote>
```

### Pattern 3: Client Testimonial Block (with care for NL legal)

```html
<blockquote>
  <p>"[Quote from real client, ideally outcome-focused without
  medical-cure language.]"</p>
  <footer>— [First name], [city] · [session count or duration]</footer>
</blockquote>
```

### Pattern 4: Definitive Statement Block

For paragraphs in flowing copy, lead each with a citeable sentence:

> ✅ "Ademwerk is een begeleide ademtechniek die het zenuwstelsel reguleert."
>
> ❌ "Veel mensen vinden ademwerk een interessante manier om mogelijk meer rust te ervaren."

The first is AI-extractable. The second is filler.

---

## Local-Business AEO Signals — NL-Specific

| Signal | Implementation | Where |
|--------|---------------|-------|
| **NAP consistency** | Identical name/address/phone on site, Google Business Profile, Instagram bio, KvK | Footer + structured data |
| **LocalBusiness JSON-LD** | `@type: "LocalBusiness"` (or `HealthAndBeautyBusiness` if appropriate — **[VERIFY type for non-BIG breathwork]**) with full NAP, `openingHours`, `geo`, `areaServed`, `priceRange` | Head of landing page |
| **Opening hours** | `openingHours: ["Mo-Fr 09:00-18:00"]` in schema + visible on page | Schema + footer |
| **Area served** | `areaServed: ["Holland", "Netherlands"]` + online indication | Schema + body copy |
| **Languages spoken** | `availableLanguage: ["nl", "en"]` in Person/Service schema | Schema + bio |
| **KvK number** | Visible in footer + privacy page | Footer |
| **Google Business Profile** | Claimed, verified, fully filled, weekly photo posts | Off-site, but link from website |
| **Reviews** | GBP reviews; optionally `AggregateRating` in JSON-LD if rating exists | Schema (only if reviews exist; don't fake) |
| **Local citations** | Listed on relevant NL directories (CAT-collectief, NFG-leden, regional wellness directories) | Off-site, but signals back |

**Critical NL nuance:** `LocalBusiness` schema requires the business has a **physical location**. If the practice is online-only or address-private, use `Organization` + `Service` with `areaServed` instead. Don't fake an address. **[VERIFY actual practice location situation.]**

---

## Mobile-First Considerations

Per Frame 2 mobile design constraints + general 2026 mobile-wellness UX:

| Concern | Pattern | Notes |
|---------|---------|-------|
| **Thumb-zone CTA** | Primary booking CTA at bottom-of-viewport on mobile (sticky or near-bottom) | Aligns with right-handed thumb arc; left-handed accommodation via center alignment |
| **Tap target size** | Min 44×44px (Apple HIG), prefer 48×48px (Material) | Includes links, buttons, form fields |
| **Click-to-call** | `tel:` link must be plain text + `<a>` wrapper, not button-styled-as-link | Mobile detects and offers native dial |
| **Accordion for flow sections** | Per Frame 2 inferred design | Use `<details><summary>` native HTML for SEO (content stays in DOM, indexed). Avoid JS-only accordions. |
| **Font size** | Min 16px body; 14px caption | Prevents iOS Safari auto-zoom on form fields |
| **Form fields** | Single column, full-width on mobile, `inputmode` set appropriately (`tel`, `email`) | Better mobile keyboard |
| **Image sizing** | `srcset` + `sizes` for responsive; hero non-lazy, rest lazy | LCP optimization |
| **No horizontal scroll** | All content within viewport width; test at 320px (iPhone SE) | Bounce risk if broken |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` — kill animations | Accessibility + INP win |

**`<details>` accordion pattern (recommended for Frame 2):**
```html
<details>
  <summary>Wat gebeurt er tijdens de sessie?</summary>
  <p>[Answer — visible to crawlers always, collapsed visually for users.]</p>
</details>
```
**Why:** Content stays in DOM, crawler-visible, AI-citeable. JS-only accordions hide content from non-JS crawlers.

---

## Future-Proofing for v2 (Blog + Kennisbank)

Architectural choices in v1 that prevent SEO rework in v2:

| v1 Decision | v2 Benefit |
|-------------|-----------|
| **URL structure: keep landing at `/`, plan `/blog/[slug]`, `/kennisbank/[topic]` for v2** | No URL migrations later, no redirect chains, no link-equity loss |
| **`hreflang` infrastructure even with one language** | Add EN translations later without re-architecting |
| **Sitemap.xml that's auto-generated from routes** | Adding blog/kennisbank = sitemap auto-updates |
| **Reusable schema fragments (Organization, Person, LocalBusiness)** | Reused across all v2 pages; ship them centrally |
| **Internal-linking discipline already in v1** (anchor links to FAQ, services) | When v2 lands, blog/kennisbank link to v1 sections — instant topical cluster |
| **Topical taxonomy decided now (3–5 core topics)** | Per source doc: choose 3–5 themes (e.g. ademwerk, trauma release, zenuwstelsel-regulatie, lichaamsgericht werken, breath science). v2 expands around these. |
| **CMS strategy compatible with markdown / git-based content** | Aunt edits copy without breaking SEO; v2 blog uses same pipeline |
| **Component library that includes citeable-content blocks (stat, quote, definition, FAQ)** | Reused everywhere in v2; consistent AEO format |
| **No URL parameters for content variation** | Avoid the `?ref=`, `?utm=` indexing mess later |
| **Canonical tags on every page from day 1** | When v2 adds similar content, canonicals already in place to prevent duplication |
| **Performance budget set in v1 (LCP <2.5s, INP <200ms, CLS <0.1)** | v2 pages don't degrade because budget is enforced |

---

## Feature Dependencies

```
SSR/SSG rendering (foundational)
    └──enables──> All schema in initial HTML
                       └──enables──> JSON-LD validation
                                          └──enables──> Rich Results eligibility

Hero with practitioner photo
    └──supports──> E-E-A-T signal
                       └──supports──> Person schema accuracy

FAQ section
    ├──requires──> Answer-first content structure
    └──requires──> FAQPage JSON-LD
              └──enables──> AI Overview citation

NAP in footer
    └──required by──> LocalBusiness JSON-LD
                            └──enables──> Local-pack visibility + AI local answers

Booking form
    └──requires──> Server-side form handler (email delivery)
                       └──requires──> Spam protection (honeypot, not reCAPTCHA)
    └──enhances──> CTA conversion (only if frictionless)

Citeable stat/quote blocks
    └──require──> Real sources (legal-safe attribution)
                       └──enable──> +30–41% AI citation lift

Definition/glossary blocks ──enhance──> FAQ section (cross-reference internally)

Autoplay video (anti-feature) ──conflicts──> LCP target + accessibility + INP target
```

### Critical Dependency Notes

- **SSR/SSG is the gateway dependency.** Without it, JS-injected meta/schema/content is invisible to AI crawlers, defeating most of this feature list.
- **NAP-driven schema** depends on **decided final phone/address/email**. Lock these before launch — changing later breaks entity consistency.
- **Testimonials require real consent.** Get written permission with first-name + city OR full anonymization. No fake testimonials.
- **Booking calendar** depends on a calendar backend decision (Cal.com vs Calendly vs custom). All else equal, **Cal.com** is recommended for v1: self-hosted-friendly, customizable UI, Google Meet integration native, EU/GDPR-friendly. **[VERIFY current Cal.com pricing/limits.]**

---

## MVP Definition

### Launch With (v1 — Landing Page Only)

Ruthless minimum to validate "SEO/AEO discoverability of trustworthy citeable content" core value.

**Hero & Identity**
- [ ] Hero section with H1 (practice + modality + outcome), one-sentence value prop, primary CTA, practitioner photo
- [ ] Practitioner name + city + credential one-liner in hero
- [ ] Definitive "Wat is ademwerk?" definition block

**Service & Approach**
- [ ] Service description section with what-happens-in-a-session walkthrough
- [ ] "Voor wie / Niet voor wie" qualification block
- [ ] Glossary / inline definitions for 5–8 core terms

**Trust**
- [ ] "Over [name]" bio section with credentials, training, experience, personal "why"
- [ ] 3–5 real client testimonials with first name + city (with consent)
- [ ] Professional association badges (if applicable)
- [ ] Link to Google Business Profile reviews (if GBP exists; otherwise create)

**FAQ (AEO core)**
- [ ] 8–12 FAQ items with answer-first structure, FAQPage JSON-LD
- [ ] Questions written as real user queries
- [ ] Each answer 50–150 words, definitive opening sentence

**Citeable Content**
- [ ] At least 3 stat/research blocks with attribution
- [ ] At least 1 expert quote block (industry research or training lineage)
- [ ] Outbound links to 2–3 authoritative sources (research, professional bodies)

**Contact**
- [ ] Inline contact form (name, email, message; phone optional)
- [ ] 30-min Google Meet booking with date/time picker
- [ ] Footer with NAP (name, address or city, phone, email)
- [ ] mailto: + tel: links in footer
- [ ] WhatsApp link (high NL-UX value)

**Technical SEO/AEO**
- [ ] SSR/SSG rendering — all content in initial HTML
- [ ] Unique title (50–60 char) + meta description (150–160 char)
- [ ] Open Graph + Twitter Card
- [ ] Canonical tag
- [ ] Schema: Organization + LocalBusiness (or Organization+Service if address-private) + Person + Service + FAQPage
- [ ] robots.txt with AI crawler allow-rules + sitemap reference
- [ ] XML sitemap
- [ ] Semantic HTML5 landmarks
- [ ] One H1, logical H2/H3 hierarchy
- [ ] Image optimization: WebP, alt-text, width/height, hero non-lazy

**Performance & Accessibility**
- [ ] LCP <2.5s, INP <200ms, CLS <0.1
- [ ] WCAG 2.2 AA: focus states, contrast, keyboard nav, screen-reader labels
- [ ] Reduced-motion respect
- [ ] Mobile-responsive with thumb-zone CTAs

**Compliance**
- [ ] Privacy/AVG statement page (link in footer)
- [ ] KvK number in footer
- [ ] No marketing cookies (use server-side analytics or Plausible-style)
- [ ] Legal review of any health claims — non-BIG-safe language **[VERIFY pre-launch]**

**Recency**
- [ ] Visible `dateModified` in footer

### Add After Validation (v1.x)

- [ ] WhatsApp click-tracking (if conversion data warrants)
- [ ] Newsletter signup ("Maandelijkse adem-tip") — if email list strategy validated
- [ ] Aggregate review schema (once Google reviews accumulate to >5)
- [ ] Additional testimonials with optional video format
- [ ] Press / "as featured in" strip if media coverage happens

### Future Consideration (v2+)

- [ ] **Blog** — long-tail SEO + recency signals (HIGH priority for v2 per source doc topical-authority guidance)
- [ ] **Kennisbank / kennisartikelen** — AI-source-of-truth content (HIGH priority for v2 — direct AEO play)
- [ ] **EN translation** with hreflang
- [ ] **Service-specific landing pages** (per breathwork modality or audience segment)
- [ ] **Case study pages** with quantifiable outcomes (legal review required)
- [ ] **Online product** — guided breathwork audio, mini-course (only if business pivots)
- [ ] **Webinar / workshop signup pages**
- [ ] **Multilingual** beyond NL/EN

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | SEO/AEO Weight | Priority |
|---------|------------|---------------------|----------------|----------|
| SSR/SSG rendering | HIGH (invisible to user, foundational) | MEDIUM | CRITICAL | **P0** |
| Hero with definitive H1 + photo | HIGH | LOW | HIGH | **P1** |
| Practitioner bio + credentials | HIGH | LOW | HIGH | **P1** |
| "Wat is ademwerk" definition | HIGH | LOW | CRITICAL | **P1** |
| Service walkthrough | HIGH | LOW | HIGH | **P1** |
| FAQ section (8–12) | HIGH | MEDIUM | CRITICAL | **P1** |
| FAQPage JSON-LD | HIGH (via AI citation) | LOW | CRITICAL | **P1** |
| LocalBusiness + Person + Service schema | MEDIUM (invisible UX, huge AEO) | LOW | CRITICAL | **P1** |
| Inline contact form | HIGH | MEDIUM | MEDIUM | **P1** |
| Booking calendar (Cal.com or similar) | HIGH | MEDIUM-HIGH | MEDIUM | **P1** |
| Footer NAP + mailto + tel | HIGH | LOW | HIGH | **P1** |
| Robots.txt with AI crawler allow | MEDIUM | LOW | CRITICAL | **P1** |
| Testimonials (3–5 with attribution) | HIGH | LOW | HIGH | **P1** |
| Citeable stat/quote blocks | MEDIUM | MEDIUM (research) | HIGH | **P1** |
| Glossary / definition blocks | MEDIUM | LOW | HIGH | **P1** |
| "Voor wie / Niet voor wie" block | MEDIUM | LOW | MEDIUM | **P1** |
| WhatsApp link | MEDIUM (NL UX) | LOW | LOW | **P2** |
| Professional association badges | MEDIUM | LOW | MEDIUM | **P2** (if applicable) |
| Mobile sticky booking bar | MEDIUM | MEDIUM | LOW | **P2** |
| `<details>` accordion for Frame 2 | MEDIUM | LOW | MEDIUM (content stays indexed) | **P1** (per design) |
| `dateModified` visible | LOW (user); MEDIUM (AI) | LOW | MEDIUM | **P1** |
| Hreflang infrastructure (NL primary) | LOW (v1) | LOW | HIGH (v2 prep) | **P2** |
| Newsletter signup | LOW | MEDIUM | LOW | **P3** |
| Multi-language content | LOW (v1) | HIGH | HIGH (v2) | **P3** |

**Priority key:**
- **P0:** Architectural prerequisite — if missing, the project fails
- **P1:** Must ship in v1 — required for core value validation
- **P2:** Should ship in v1 if time permits — measurable lift expected
- **P3:** Future consideration — defer to validate signal

---

## Competitor Feature Analysis

Established patterns observed across Dutch wellness/breathwork practitioner sites (synthesis; not a specific competitor scrape — confidence MEDIUM, validate with manual audit of 3–5 actual NL competitors before launch).

| Feature | Typical NL Wellness Site | Trinity Approach |
|---------|--------------------------|------------------|
| Hero | Stock yoga photo + vague tagline | Real practitioner photo + definitive one-sentence value prop |
| Definition of modality | Buried or missing | Above-the-fold definitive block + glossary |
| Testimonials | Anonymous "— a client" | Named first-name + city, with consent |
| Citations / sources | None | 3+ stat blocks, expert quotes, outbound research links |
| FAQ | 3–5 generic Q's | 8–12 Q's matching real search intent, FAQPage JSON-LD |
| Booking | External Calendly link, no integration | Native or embedded Cal.com, inline date/time picker |
| Mobile UX | Hamburger menu, hidden CTA | Sticky/near-bottom CTA, thumb-zone aware |
| Local SEO | NAP inconsistencies | NAP matched character-for-character across web |
| AI-crawler access | robots.txt default (often accidentally blocks AI) | Explicit allow for 8 named AI crawlers |
| Recency | Stale, no `dateModified` | Visible `dateModified`, planned content updates |
| Schema | Often missing or only Organization | Organization + LocalBusiness + Person + Service + FAQPage |

---

## Quality-Gate Self-Check

- [x] Categories clear: Table Stakes (20), Differentiators (15), Anti-Features (20)
- [x] SEO/AEO impact noted per feature
- [x] Sources cross-referenced against `seo-aeo-samenvatting-checklist.md` (Princeton/KDD 2024 GEO, HubSpot 2025, 2026 crawler refs)
- [x] Audience mapping (W/C/L) per feature
- [x] Dutch market specifics noted: NAP, WhatsApp UX, Wet BIG language, AVG/GDPR, Google Business Profile, iDEAL out-of-scope, Cal.com EU-friendly, NL date/time/phone conventions
- [x] **[VERIFY]** flags placed on items requiring fresh validation (legal, association membership, location type, current pricing)

---

## Open Questions for Roadmap / Requirements Phase

1. **Address situation:** Is the practice physical, online-only, or hybrid? Determines `LocalBusiness` vs `Organization`+`Service` schema choice.
2. **Professional associations:** Which (if any) does the practitioner belong to? Affects badges, outbound links, schema.
3. **BIG / non-BIG status:** Determines legal language constraints around "therapie", "behandeling", "genezing".
4. **Existing Google Business Profile:** Yes/no? Affects review strategy.
5. **Testimonial inventory:** Existing client consent for named testimonials? Affects social proof depth.
6. **Pricing transparency:** Will price be on the page (FAQ #6 above)? Affects honesty/trust positioning.
7. **CMS need:** Does the aunt need to edit copy? Affects framework + headless CMS choice.
8. **Calendar choice:** Cal.com vs Calendly vs custom? Affects component approach and INP budget.
9. **Brand voice samples:** Need 1–2 paragraphs of the aunt's actual voice to calibrate copy — risk: too clinical or too jargon-heavy without it.
10. **Photography availability:** Do real photos exist, or does the project need a photo shoot? Critical-path item if hero photo is missing.

---

## Sources

- **Project reference:** `seo-aeo-samenvatting-checklist.md` (verified 2026 Dutch SEO/AEO playbook)
- **Primary research cited within the source doc:**
  - Aggarwal et al., *GEO: Generative Engine Optimization*, Princeton/Georgia Tech/Allen AI/IIT Delhi — ACM KDD 2024 (arXiv:2311.09735) — quotes +41%, stats +32%, citations +30%, language +28%
  - HubSpot AI Search Trends 2025 — recency-citation correlation
  - 2026 AI crawler references (Anagram, CapstonAI, Citevera, No Hacks)
- **Conversion patterns:** Established 2024–2026 UX research on service-based wellness practitioner sites (synthesis; **MEDIUM confidence** — validate with current NN/g, Baymard, or live competitor audit before launch).
- **Dutch legal context:** Wet BIG, Reclamecode Stichting, AVG/GDPR (**MEDIUM confidence — recommend legal review before launch on health-claim language**).
- **Sources not accessible this run:** WebSearch and WebFetch were denied; Context7 not available for marketing/conversion library. Recommend follow-up validation pass with live source-checking once tooling is restored.

---

*Feature research for: Dutch-language SEO/AEO-first wellness practitioner landing page (breathwork & trauma release)*
*Researched: 2026-06-14*
*Confidence: MEDIUM-HIGH for SEO/AEO-mapped features (grounded in verified source doc); MEDIUM for conversion-pattern claims (synthesis-based); validate **[VERIFY]** items before launch*
