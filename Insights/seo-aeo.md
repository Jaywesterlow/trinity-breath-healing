# SEO + AEO Playbook — Reusable Reference

> Extracted from Trinity Breath & Healing Phase 0.
> **Copy this into Obsidian.** Apply to any future project that needs SEO/AEO.
> No re-research needed — these techniques are verified as of 2026.

---

## What Is AEO and Why It Matters Now

**SEO** = ranking in Google's blue-link results.
**AEO** (Answer Engine Optimization) = being *cited* by AI engines: Google AI Overviews, ChatGPT, Perplexity, Claude, Apple Intelligence.

The two overlap heavily but AEO has one extra requirement: your content must be **structured, citeable, and parseable by a language model** — not just crawlable by Googlebot.

**2026 reality:** AI engines answer queries directly. If your site isn't cited, you're invisible to a growing share of searches. For a wellness/local practice, AI citation is often higher-impact than traditional ranking because it delivers intent-matched answers ("best breathwork practice in Holland") with your name attached.

---

## The Single Most Important Rule

> **AI crawlers do not execute JavaScript.**

If your content is rendered client-side (React SPA, Vue SPA, Angular), AI crawlers see an empty page. They cannot cite what they cannot read.

**Required:** SSR (Server-Side Rendering) or SSG (Static Site Generation). Every piece of content — heading, body text, meta, JSON-LD — must exist in the raw HTML on first HTTP response.

**Frameworks that satisfy this:**
- Astro (SSG by default, zero JS output)
- SvelteKit (SSR/SSG, `adapter-static` or `adapter-vercel`)
- Next.js App Router (SSR/SSG if done correctly — easy to accidentally ship CSR)
- Nuxt 3 (SSR/SSG)

**Frameworks that fail this:**
- Create React App (CSR only)
- Vite SPA (CSR only)
- Any client-only SPA

---

## Core Technical Checklist

### A — HTML Structure (Every Page)

| Requirement | Spec | Why |
|-------------|------|-----|
| Exactly one `<h1>` per page | Unique, keyword-rich | Multiple H1s confuse crawlers; zero H1s = no topic signal |
| `<title>` tag | 50–60 characters | Truncated in SERPs beyond 60; too short = missed keyword surface |
| `<meta name="description">` | 150–160 characters | Snippet shown in results; AI engines use it to classify the page |
| Canonical tag | `<link rel="canonical" href="https://domain.com/path">` | Prevents duplicate content penalty across variants |
| `lang` attribute on `<html>` | `lang="nl"` (Dutch), or appropriate locale | Search engines and AI engines use this for language classification |
| `hreflang` tags | Even if Dutch-only now, add `hreflang="nl"` + `hreflang="x-default"` | Future-proofs multilingual; wrong hreflang is hard to fix retroactively |
| `<meta charset="UTF-8">` | Always | Encoding declaration must appear in first 1024 bytes |
| Open Graph tags | `og:title`, `og:description`, `og:image`, `og:locale` | Social sharing + some AI engines read OG as fallback |
| `og:locale` | `nl_NL` for Dutch | Required for correct language classification in social graph |
| Viewport meta | `<meta name="viewport" content="width=device-width, initial-scale=1">` | Mobile-first indexing — Google uses mobile version |

### B — Core Web Vitals (Performance = Ranking Signal)

| Metric | Target | How to Hit It |
|--------|--------|---------------|
| LCP (Largest Contentful Paint) | < 2.5s | Hero image = `loading="eager"` + `fetchpriority="high"` + `<link rel="preload">`. No render-blocking JS. |
| INP (Interaction to Next Paint) | < 200ms | No CSS-in-JS runtime. Minimal event handlers. No heavy third-party scripts on load. |
| CLS (Cumulative Layout Shift) | < 0.1 | Every image has explicit `width` + `height`. No late-injected content above fold. No web fonts without `font-display: swap`. |

**Never lazy-load the hero image.** It IS the LCP element — lazy-loading it causes LCP to spike.

### C — Structured Data / JSON-LD (AEO Critical)

JSON-LD is the primary mechanism AI engines use to extract and cite facts. Without it, the AI must infer from prose — lower confidence, lower citation rate.

**Required schema types for a service/local business:**

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "name": "Trinity Breath & Healing",
      "description": "...",
      "address": { "@type": "PostalAddress", "addressLocality": "Holland" },
      "telephone": "...",
      "url": "https://domain.com",
      "sameAs": ["https://instagram.com/..."]
    },
    {
      "@type": "WebPage",
      "@id": "https://domain.com/#webpage",
      "url": "https://domain.com/",
      "name": "Page title",
      "dateModified": "2026-06-19"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://domain.com/" }
      ]
    }
  ]
}
```

**Use `@graph` (array), not nested objects.** Nesting creates ambiguous entity relationships. `@graph` makes each entity a first-class node.

**Schema types by use case:**

| Use Case | Schema Type |
|----------|-------------|
| Local business / practice | `LocalBusiness` → `ProfessionalService` (subtype) |
| Individual service (e.g. breathwork session) | `Service` with `provider` linking to the org |
| FAQ section | `FAQPage` + `Question` + `Answer` |
| Blog post / article | `BlogPosting` or `Article` with `datePublished`, `dateModified`, `author` |
| Person (practitioner) | `Person` with `jobTitle`, `worksFor`, `sameAs` |
| Breadcrumb trail | `BreadcrumbList` + `ListItem` on every page except home |

**For wellness/health practitioners specifically:**
- Use `ProfessionalService`, not just `LocalBusiness`
- Add `Person` node for the practitioner (E-E-A-T — proves a real human is behind the practice)
- Include `sameAs` with Instagram/LinkedIn — cross-references build entity trust

### D — Sitemap + robots.txt

**sitemap.xml:**
- Auto-generate from your route list. Never hand-maintain.
- Include `lastmod` (ISO date) for every URL — freshness signal.
- Reference from `robots.txt`: `Sitemap: https://domain.com/sitemap.xml`
- Submit to Google Search Console after every significant content update.

**robots.txt — AI crawler allowlist pattern:**
```
# AI crawlers (explicit Allow BEFORE wildcard)
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

# Default
User-agent: *
Allow: /

Sitemap: https://domain.com/sitemap.xml
```

**Why explicit Allow before wildcard?** Some crawlers respect order-of-precedence. Placing AI crawlers before `*` is defensive — some implementations stop at the first matching rule.

**Do NOT use `llms.txt` or `llms-full.txt`.** No major AI crawler honored it as of 2026. It is cargo-cult SEO.

---

## E-E-A-T for Health/Wellness Sites

Google's quality rater guidelines heavily weight **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) for health content. AI engines inherit this weighting.

**Required for a wellness practice:**

| Signal | Implementation |
|--------|---------------|
| Practitioner identity | Real name, photo, bio — not "our team" |
| Credentials | Training institution, certifications, years of practice |
| Associations | Professional bodies (CAT, NFG, RBCZ, etc.) — add to `Person.memberOf` JSON-LD |
| KvK / BIG registration | Visible in footer + JSON-LD `identifier` field |
| Contact information | Real phone, email, address (even city-level for home practice) |
| Consistent NAP | Name, Address, Phone — identical across the site, Google Business Profile, social |
| Freshness signals | `dateModified` visible on pages + in JSON-LD. Regular content updates. |
| Reviews | Google Business Profile reviews linked via `sameAs` |

**Dutch-specific:**
- Wet BIG: if not BIG-registered, avoid any language implying clinical diagnosis or treatment. Use "begeleiding" (guidance), not "behandeling" (treatment) for covered acts.
- Reclame Code Stichting: health claims require evidence or must be framed as personal experience.
- Two-sentence pattern: every health claim followed by a qualifying sentence. ("Ademwerk kan rust geven. Resultaten verschillen per persoon.")

---

## F — URL Architecture

**One permanent URL per piece of content.** Never change URLs after indexing — every URL change costs you the link equity and citation history of the old URL.

**For a multi-page site:**
- Reserve all URLs on day one (even as stubs returning 200 with placeholder content)
- Stubs must have distinct `<title>`, `<meta description>`, canonical, and JSON-LD — NOT the same placeholder on every stub
- When you deepen a stub to real content in v2, only the body changes; URL + schema structure persists

**URL slug rules:**
- Dutch words in slugs (not English): `/werkwijze`, not `/method`
- Hyphens, not underscores: `/over-mij`, not `/over_mij`
- No trailing slashes inconsistency — pick one and canonicalize

---

## G — Freshness Signals (AEO Specific)

AI engines weight recency. A site last crawled in 2023 gets deprioritized for "current best breathwork practice" queries.

**Implement:**
1. Visible `<time datetime="YYYY-MM-DD">Laatste update: 2026-06-19</time>` near page footer
2. Same ISO date in JSON-LD `WebPage.dateModified`
3. Single source of truth — inject build date at build time (Vite `define`, Astro frontmatter injection, etc.), not hardcoded
4. For blog/articles: `datePublished` + `dateModified` in `BlogPosting` JSON-LD

---

## H — Dutch-Language Search Specifics

| Tactic | Detail |
|--------|--------|
| `lang="nl"` on `<html>` | Required for Google to serve you on Dutch queries |
| Dutch copy in `<title>` and `<meta description>` | Don't translate titles into English for "international reach" on a local practice |
| `hreflang="nl" href="..."` | Even for Dutch-only sites — signals to Google this is the canonical Dutch version |
| Schema `inLanguage: "nl"` | Add to `WebPage` nodes |
| NAP in Dutch locale format | Phone: `+31 ...` format; address: Dutch postal convention |
| Google Business Profile in Dutch | Practitioner manages this separately; must match site NAP exactly |

---

## What NOT to Do

| Avoid | Why |
|-------|-----|
| Client-side rendering (React SPA, Vue SPA) | AI crawlers see empty HTML |
| CSS-in-JS runtime (styled-components, Emotion) | Adds JS = worse INP; FOUC risk |
| Lazy-loading hero image | Kills LCP |
| Duplicate meta descriptions across pages | Google devalues all of them |
| Dynamic `[slug]` routes for pages that need distinct schema | Use static routes — each gets its own compiled HTML with distinct JSON-LD |
| Cookie consent banner if avoidable | Adds CLS + conversion friction. Use Plausible (cookieless) to avoid it entirely. |
| `noindex` on stub pages | Stubs must be indexed — they claim URL real estate |
| Heading level skips (H1 → H4) | Semantic structure is an accessibility AND SEO signal |
| Multiple H1 per page | Confuses topic classification |
| `llms.txt` / `llms-full.txt` | No AI crawler honors it (2026-verified). Wasted effort. |
| Self-referential canonical errors | Each page canonical = its own URL, not homepage |

---

## Implementation Order for a New Project

```
1. Framework choice → must be SSR/SSG capable
2. Plan A: HTML primitives (PageTitle, PageMeta with canonical/OG/hreflang)
3. Plan B: JSON-LD primitives (buildGraph, buildWebPage, buildBreadcrumb, schema types)
4. Plan C: robots.txt (AI crawler allowlist) + sitemap.xml (auto-generated)
5. Plan D: Reserve all URLs as stubs (distinct title/meta/JSON-LD per stub)
6. Plan E: Visible dateModified (build-time injection → <time datetime> + JSON-LD WebPage.dateModified)
7. Plan F: CI gates (validate JSON-LD, check H1 count, check initial HTML via curl)
8. → Visible UI work begins (Phase 1)
```

---

## Tools & Validation

| Tool | What to Check |
|------|--------------|
| Google Rich Results Test | JSON-LD validity before every prod push |
| Google Search Console | Sitemap, indexation, CWV field data, structured data errors |
| Lighthouse (mobile) | LCP, INP, CLS, SEO score (must be 100), Accessibility score (must be 100) |
| `curl -A "OAI-SearchBot" <url>` | Simulates AI crawler — verifies content in initial HTML |
| `curl -A "PerplexityBot" <url>` | Same for Perplexity |
| pa11y / axe-core | WCAG 2.2 AA — accessibility is an SEO signal |
| Perplexity / ChatGPT / Claude | Manual citation test: search for your target queries and check if your site is cited |

---

## Token Cost Reality (Why It Took So Long)

For reference when planning future projects:

| Phase | Real cost driver |
|-------|----------------|
| Research (one-time) | ~3 sessions. Now documented here — skip entirely for future projects. |
| Primitives (Plans 02–04) | ~2 sessions. Reusable components once built — can be copy-pasted to new SvelteKit project. |
| Stub routes (Plan 05) | ~1–2 sessions. 28 files + Playwright tests. This is genuinely large work. |
| CI gates (Plan 08) | ~1 session. |
| Visible UI (Phase 1) | ~4–6 sessions (8 landing sections × TDD). This is where the site becomes visible. |

**Future project estimate with this doc in Obsidian:** Foundation phase compresses from ~7 sessions to ~3–4 sessions (research eliminated, primitives templated). UI work stays the same — it's real design implementation.
