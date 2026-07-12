# UNKNOWNS — Trinity Breath & Healing

**Purpose:** Single source of every fact still missing. Replaces nothing already locked from Figma designs (see DESIGN-FACTS section below).

**Last updated:** 2026-06-15 after Figma frames read

---

## ✅ Locked from Figma designs (no longer unknown)

### Brand identity
- **Full brand name:** TRINITY Breath & Healing
- **Logo:** Yellow/gold lotus-heart icon + wordmark (file format TBD — see Logo section below)
- **Domain:** `trinitybnh.nl` (extracted from `info@trinitybnh.nl`)
- **Email (public):** `info@trinitybnh.nl`
- **Address:** Stationsstraat 45 A, 1315 KS Almere, Nederland
- **Social channels present:** X (Twitter), Facebook, Instagram

### Services list (v1 scope)
1. Mahatma Healing
2. Goldhealing
3. Raster Energie *(NOTE: design says "Raster Energie" not "Raster Healing")*
4. Spinal Touch *(NEW — wasn't in earlier conversation)*
5. "Meer diensten" link (= more services planned but not surfaced v1)

Brand body copy also mentions: "ademwerk" (breathwork), "lichaamsgerichte therapie" (body-oriented therapy), "energetische en energiegerichte behandelingen" (energetic and energy-directed treatments) — these are framing terms, not separate menu items.

### Site structure (locked by footer + nav)
- **MENU routes:** `/` (Home), `/werkwijze`, `/over-mij`, `/behandelingen`, `/contact`
- **DIENSTEN routes:** `/diensten/mahatma-healing`, `/diensten/goldhealing`, `/diensten/raster-energie`, `/diensten/spinal-touch`, `/diensten` (meer diensten)
- **LEZEN routes:** `/blog`, `/artikelen`, `/faq`, `/reviews`
- **Footer-only routes:** `/privacyverklaring`, `/algemene-voorwaarden`
- **Total: ~14 unique routes** referenced by the design — v1 only builds `/` content but ALL these routes must return 200 with stub pages (zero-301 v2 migration guarantee)

### Hero content (LOCKED — do not invent)
- **H1:** "Rust in je hoofd. Ontspanning in je lichaam."
- **Body (desktop):** "Ik weet hoe het voelt om vast te lopen, fysiek, mentaal of emotioneel. Via lichaamsgerichte therapie, energetisch en energiegerichte behandelingen help ik jou bij belangrijke stappen naar herstel en evolutie."
- **Body (mobile — shorter variant):** "Ik weet hoe het voelt om vast te lopen, fysiek, mentaal en emotioneel. Via lichaamsgerichte therapie, ademwerk en energetische behandelingen help ik jou terug naar rust, herstel en jezelf."
- **DECISION NEEDED:** which body wording is canonical? Recommend desktop wording for SEO (longer = more keyword surface).
- **Primary CTA:** "Maak een afspraak"

### Werkwijze section (3 cards — LOCKED)
- **Section eyebrow:** "Werkwijze"
- **Section heading:** "Rustig, persoonlijk en op jouw tempo."
- **Card 1 — Kennismaking:** "Wat loskomt, laten we landen. Stap voor stap groeit er meer rust en ruimte, in je hoofd én je lijf."
- **Card 2 — De sessie:** "Met adem en lichaamswerk kom je in contact met wat er onder de oppervlakte leeft."
- **Card 3 — Verdieping:** "We beginnen rustig. In een eerste gesprek kijken we samen wat er speelt en wat je nodig hebt." + inline "Maak een afspraak" CTA
- **MOBILE GAP:** Frame 2 mobile missing — user said accordion needed to swipe through. Infer: stacked accordion (3 collapsed cards, tap to expand).

### About me / Stats section (LOCKED)
- **Section eyebrow:** "Over mij"
- **Section heading:** "Vanuit eigen ervaring weet ik wat jij doormaakt."
- **Body:** "Ik ben 53 jaar en weet uit eigen ervaring hoe het voelt om vast te lopen. Mijn aanpak is geen theorie, het is wat mij zelf heeft geholpen. Ik werk vanuit rust, veiligheid en echte ervaring."
- **Bullet 1 — Vanuit eigen ervaring:** "Geen aangeleerde theorie, maar een aanpak die ik zelf heb doorleefd."
- **Bullet 2 — Vakkundig opgeleid:** (placeholder same as bullet 1 — REAL TEXT NEEDED from aunt — see Open Items below)
- **CTA:** "Lees meer over mij →" (links to `/over-mij`)
- **Stats blocks (citation/proof — LOCKED):**
  - **8+ Jaren ervaring**
  - **65+ Klachten verholpen**
  - **∞ Mogelijkheden voor herstel**

### Service selector section (Frame 4 — LOCKED)
- **Eyebrow:** "Werkwijze" *(NOTE: design re-uses "Werkwijze" tag here — confirm or change)*
- **Heading:** "Rustig, persoonlijk en op jouw tempo." *(repeats earlier section heading)*
- **Active card example shown:** Mahatma Healing (rose icon)
- **5 cards total in horizontal carousel/scroll** — likely: Mahatma Healing · Goldhealing · Raster Energie · Spinal Touch · Meer diensten
- **MOBILE GAP:** active state only shown for Mahatma — infer other cards from same pattern (icon + name when active, icon-only/different style when inactive)

### Contact + Booking section (LOCKED)
- **Eyebrow:** "Over mij" *(design re-uses "Over mij" — possible inconsistency; confirm OR drop eyebrow)*
- **Heading:** "Een eerste stap hoeft niet groot te zijn."
- **Body:** "Wil je iets vragen, of meteen een gesprek plannen? Laat een bericht achter of kies een moment dat jou uitkomt. Ik neem zo snel mogelijk contact op."
- **Sub-body:** "U kunt contact opnemen door het contactformulier in te vullen, direct te mailen naar info@trinitybnh.nl, of door een 30 minuten online meeting in te plannen. Kies wat voor jou prettig voelt."
- **TOGGLE (radio):** ⦿ Email formulier / ○ Online meeting
- **Form fields when "Email formulier":**
  - Voornaam (required)
  - Achternaam (required)
  - Email (required)
  - Telefoon — `+31` prefix + number (optional?)
  - Bericht (textarea, required) — placeholder "Schrijf jouw bericht"
  - Submit: "Verstuur email"
- **Form fields when "Online meeting":**
  - Calendar widget (month picker, day select, available/selected indicators)
  - Implementation = Cal.com inline embed inside the section, `client:visible` activated on toggle
- **DESIGN CHANGE FROM EARLIER ASSUMPTION:** booking is inline on landing, NOT on separate `/boeken` page. `/boeken` route can still exist as a deep link to scroll/focus the contact section.

### Footer (LOCKED)
- Logo + wordmark
- Address: Stationsstraat 45 A, 1315 KS Almere, Nederland
- Email: info@trinitybnh.nl
- Phone: (+31) 6 123 456 78 *(numeric pattern looks like wireframe placeholder — REAL phone needed)*
- Social: X · Facebook · Instagram
- DIENSTEN column: 5 services
- MENU column: Home · Over mij · Behandelingen · Werkwijze · Contact
- LEZEN column: Blog · Artikelen · FAQ · Reviews
- Bottom links: Privacyverklaring · Algemene voorwaarden
- Copyright: ©Copyright 2026 Trinity Breath & Healing, alle rechten voorbehouden

### Design system
- **Color palette (extracted):** warm cream/sand background (~#F2EBDD), dark forest green (~#3A4530), gold accent (~#D4A968), soft warm beige cards
- **Typography:** Serif headlines (Display) + Sans body — exact font families TBD (Figma Dev Mode export needed)
- **Decorative motif:** Hand-drawn line illustration (tree + winding river/stream) on hero — recurring nature/water theme

### Decisions implied by design
- **No practitioner photo in hero** — uses tree/river illustration. Hero LCP element = decorative SVG/PNG illustration, NOT a photo.
- **No testimonials section on landing** — `/reviews` route exists but no inline testimonials on `/`.
- **No FAQ section on landing** — `/faq` route exists but no inline FAQ on `/`. **WARNING:** this loses the FAQPage JSON-LD AEO citation surface for v1. **Option:** add inline FAQ section anyway (override design) OR accept and ship FAQ in v2 on `/faq`.

---

## 🔒 Hard blockers — still need filling before launch

### From aunt
- [ ] **Real phone number (E.164)** — design shows wireframe placeholder
- [ ] **WhatsApp number** — same as phone or different?
- [ ] **KvK number** — required in NL footer (not in design)
- [ ] **BTW/VAT number** OR "N/A (KOR)" — required in privacy/AV pages
- [ ] **BIG status (CRITICAL)** — registered Wet BIG practitioner? Determines what vocabulary site can use ("therapeut" is BIG-protected; if not BIG, copy must use "ademcoach", "ademwerk-practitioner", "begeleider")
  - **Current copy uses "lichaamsgerichte therapie" and "therapie"** — Wet BIG risk if aunt is not a registered therapist. Must verify before Phase 4 launch gate.
- [ ] **Professional association memberships** — CAT / NFG / RBCZ / NOBCO / other / none. Affects schema `memberOf` + outbound links + trust signals.
- [ ] **Credentials/training per modality** — when/where trained: Mahatma, Goldhealing, Raster Energie, Spinal Touch, ademwerk?
- [ ] **"Vakkundig opgeleid" bullet text** — design has placeholder; need aunt's real text describing her formal training
- [ ] **Pricing** — show on landing or only in booking flow? If yes, what are the prices per service?
- [ ] **Session duration per modality** — for Cal.com event types if more than one event type needed
- [ ] **Logo files** — SVG primary + PNG fallback, light + dark variants
- [ ] **Favicon source** — square SVG ≥512px
- [ ] **OG/social-share image** — 1200×630 with logo + tagline
- [ ] **Hero illustration source file** — SVG export from Figma OR re-create from design

### Decisions YOU need to make
- [ ] **Hero body wording — desktop or mobile variant canonical?** (recommend desktop for SEO)
- [ ] **Frame 4 / contact-section eyebrow tag** — design reuses "Werkwijze" + "Over mij" tags. Drop them or rename?
- [ ] **FAQ on landing — add or not?** (design omits; AEO citation lift suggests add)
- [ ] **Testimonials on landing — add or not?** (design omits; trust lift suggests add 3–5 short ones)
- [ ] **Training-crawler decision** — allow Google-Extended + Applebot-Extended (yes/no)
- [ ] **DNS holder + Search Console account owner** — (registrar / Google account choice)
- [ ] **Design token extraction approach** — manual / Figma Dev Mode MCP / Figma Code Connect
- [ ] **CI provider** — GitHub Actions / Cloudflare Pages CI / skip
- [ ] **Repository host** — GitHub remote (public/private) / local-only
- [ ] **Staging URL** — `*.pages.dev` / `staging.trinitybnh.nl`
- [ ] **Privacy + Algemene voorwaarden content source** — generate from template / aunt provides / Dutch counsel drafts

---

## ⚠ Soft blockers — vendor verification (Phase 3)

- [ ] Astro 5 + Tailwind v4 + `@astrojs/cloudflare` version pins at `npm install`
- [ ] Cal.com Cloud EU plan + nl locale + Google Meet auto-create
- [ ] Resend `eu-west-1` plan + DMARC posture
- [ ] Plausible EU pricing
- [ ] Cloudflare Pages free-tier Worker limits

---

## ❌ Deferred to v2 (decided, not unknown)

- Multi-language (EN translation)
- Headless CMS (Sanity) migration
- Aggregate review schema
- Newsletter signup
- Per-modality deep service pages (`/diensten/<name>`)
- Blog, Artikelen, FAQ, Reviews actual content (routes exist as stubs in v1)

---

## Phase 0 placeholder strategy (updated for design-known values)

```ts
// src/lib/constants/brand.ts — values marked "TODO" still need aunt input
export const BRAND = {
  legalName: "Trinity Breath & Healing",
  shortName: "TRINITY",
  tagline: "Breath & Healing",
  practitionerFirstName: "TODO_FIRST_NAME",
  practitionerFullName: "TODO_FULL_NAME",
  practitionerAge: 53,
  domain: "https://trinitybnh.nl",
  email: "info@trinitybnh.nl",
  phone: "+31TODOTODOTODO",       // TODO real E.164
  whatsapp: "+31TODOTODOTODO",    // TODO confirm same as phone
  kvk: "TODO_KVK",
  btw: "TODO_BTW_OR_NA",
  socials: {
    instagram: "TODO_HANDLE",
    facebook: "TODO_URL",
    x: "TODO_HANDLE",
  },
  address: {
    street: "Stationsstraat 45 A",
    postalCode: "1315 KS",
    city: "Almere",
    country: "Nederland",
  },
  practiceLocations: [
    { name: "Fysio Reigersbos (Saturdays)", city: "Amsterdam-Zuidoost", openingHours: "Sa" },
    { name: "Praktijkruimte Almere", city: "Almere", openingHours: "TODO" },
  ],
  areaServed: ["Amsterdam", "Zaandam", "Almere", "Weesp", "Oostzaan", "Hoofddorp", "Badhoevedorp"],
  services: [
    { slug: "mahatma-healing", name: "Mahatma Healing", mode: "remote" },
    { slug: "goldhealing", name: "Goldhealing", mode: "remote" },
    { slug: "raster-energie", name: "Raster Energie", mode: "remote" },
    { slug: "spinal-touch", name: "Spinal Touch", mode: "in-person" },
  ],
  stats: {
    yearsExperience: 8,        // "8+ Jaren ervaring"
    complaintsResolved: 65,    // "65+ Klachten verholpen"
  },
} as const;
```

**CI gate (Phase 5 pre-launch):** `grep -rE "TODO|PLACEHOLDER" src/` must return zero matches.

---
*Last updated: 2026-06-15 after Figma frames read*
