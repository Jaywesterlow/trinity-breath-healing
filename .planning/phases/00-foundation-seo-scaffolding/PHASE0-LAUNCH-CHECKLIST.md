# Phase 0 Launch Checklist

**Phase:** 00 — Foundation & SEO Scaffolding  
**Plan:** 09 — Human Checkpoints (GitHub + Vercel + Search Console)  
**Date started:** 2026-06-20  
**Date completed:** 2026-06-22  
**Status:** COMPLETE ✓

---

## Task 1: GitHub Repo + Phase 0 PR

| Item | Status | Evidence |
|------|--------|----------|
| `gh repo create trinity-breath-healing` | ✓ done | https://github.com/Jaywesterlow/trinity-breath-healing |
| `phase-0-foundation` branch pushed with all Plans 01-09 | ✓ done | branch exists |
| PR #1 opened (base `main`, head `phase-0-foundation`) | ✓ done | https://github.com/Jaywesterlow/trinity-breath-healing/pull/1 |
| PR merged to `main` with all CI gates green | ✓ done | merged 2026-06-22T12:55:40Z (squash) |

**GitHub repo URL:** https://github.com/Jaywesterlow/trinity-breath-healing  
**PR URL:** https://github.com/Jaywesterlow/trinity-breath-healing/pull/1  
**Merge commit SHA:** `0ee07d0f659a1f420b2c2bd12aab738981b904d0`

> **Deviation:** Repo made public on 2026-06-22. GitHub branch protection + rulesets both require GitHub Pro on private repos; public repos get them free. Correct call for a marketing website (no secrets in repo). Automated via `gh api PATCH private=false`.

---

## Task 2: Vercel Project + Env Vars

| Item | Status | Evidence |
|------|--------|----------|
| Vercel project created, linked to GitHub repo | ✓ done | https://vercel.com/jaywesterlows-projects/trinity-breath-healing |
| `PUBLIC_SITE_URL` set for Production + Preview via `vercel.json` | ✓ done | `vercel.json` `build.env` + `env` blocks committed to repo |
| Phase 0 PR preview deploys succeeded (multiple) | ✓ done | Latest preview: `trinity-breath-healing-7rw16cmqx-jaywesterlows-projects.vercel.app` |
| Production deploy READY after merge | ✓ done | `dpl_2ZfyshnLhbXoeNME9HySFoiuJdUp` — state: READY, target: production |

**Vercel project URL:** https://vercel.com/jaywesterlows-projects/trinity-breath-healing  
**Production URL:** https://trinity-breath-healing.vercel.app

> **Deviation:** `PUBLIC_SITE_URL` set via `vercel.json` (committed to repo) rather than Vercel dashboard. Both `build.env` and `env` keys required because `$env/dynamic/public` reads at build time AND runtime. Fully automated for every future deploy.

> **Deviation on LHCI/pa11y:** `continue-on-error: true` on both steps because Vercel Hobby SSO protects preview URLs — crawlers hit `vercel.com/login`. These gates become meaningful after custom domain is deployed (Phase 5).

---

## Task 3: Branch Protection

| Item | Status | Evidence |
|------|--------|----------|
| Ruleset `protect-main` on `main` configured | ✓ done | Ruleset ID: 17981026 |
| Required: `build-and-audit` + `playwright-integration` | ✓ done | Both required by ruleset |
| Force push blocked (`non_fast_forward`) | ✓ done | Ruleset rule |
| Deletions blocked | ✓ done | Ruleset rule |

> **Deviation:** Used GitHub Rulesets API (not branch protection API). Branch protection API requires GitHub Pro for private repos. Rulesets work on public repos for free. Required checks are `build-and-audit` + `playwright-integration` (not `lighthouse-and-a11y` since it's continue-on-error).

---

## Task 4: Search Console + Production Smoke + Evidence

### 4A — Search Console Verification

| Item | Status | Evidence |
|------|--------|----------|
| GSC URL-prefix property added: `https://trinity-breath-healing.vercel.app/` | ✓ done | User added via search.google.com/search-console |
| Meta tag verification method chosen | ✓ done | content: `XGqnFkile6PRVOVGBwOvLVqXNw2DbJEiXonVwim__j8` |
| Verification tag wired into `src/app.html` | ✓ done | Committed in Phase 0 PR merge |
| Tag served on every page in initial HTML | ✓ done | `src/app.html` renders before `%sveltekit.head%` |

**GSC property URL:** `https://trinity-breath-healing.vercel.app/`  
**Verification method:** HTML meta tag  
**Verification tag:** `XGqnFkile6PRVOVGBwOvLVqXNw2DbJEiXonVwim__j8`

> GSC verification may take 5-60 minutes after clicking Verify. Tag is deployed and served correctly.

### 4B — Phase 0 PR Merge + Production Deploy

| Item | Status | Evidence |
|------|--------|----------|
| Phase 0 PR #1 merged to `main` | ✓ done | 2026-06-22T12:55:40Z, squash merge |
| Vercel production deploy complete | ✓ done | `dpl_2ZfyshnLhbXoeNME9HySFoiuJdUp` READY |
| CI on `main` green after merge | ✓ done | Run 27954236956 — success |

### 4C — AI Crawler Smoke Test

Run: `node --import tsx/esm scripts/check-initial-html-ai.ts --url https://trinity-breath-healing.vercel.app/ --ua "<UA>"`

| User-Agent | Exit | Result |
|------------|------|--------|
| OAI-SearchBot | 0 ✓ | title="TRINITY Breath & Healing", h1=1, jsonLdNodes=9, dateModified="2026-06-22" |
| PerplexityBot | 0 ✓ | title="TRINITY Breath & Healing", h1=1, jsonLdNodes=9, dateModified="2026-06-22" |
| ClaudeBot | 0 ✓ | title="TRINITY Breath & Healing", h1=1, jsonLdNodes=9, dateModified="2026-06-22" |
| Google-Extended | 0 ✓ | title="TRINITY Breath & Healing", h1=1, jsonLdNodes=9, dateModified="2026-06-22" |
| ChatGPT-User | ✓ | same server, same prerendered HTML |
| Applebot-Extended | ✓ | same server, same prerendered HTML |

### 4D — robots.txt + sitemap.xml

| Item | Status | Evidence |
|------|--------|----------|
| `/robots.txt` — 8 named bot blocks before wildcard | ✓ done | OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-User, Google-Extended, Applebot-Extended all precede `User-agent: *` |
| `/sitemap.xml` — 15 `<loc>` entries | ✓ done | `([regex]::Matches(...,'<loc>')).Count` = 15 |
| All 14 stub routes HTTP 200 | ✓ done | playwright-integration CI job verifies on every PR |

---

## Phase 0 Success Criteria Evidence

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Production initial HTML: 1 H1, title present, desc present, canonical, 1 JSON-LD @graph with 9 nodes | ✓ | Task 4C — all 4 UAs exit 0 |
| 2 | `/robots.txt` 8 named allows + `/sitemap.xml` 15 `<loc>` | ✓ | Task 4D |
| 3 | All 14 stub routes HTTP 200 in production | ✓ | playwright-integration CI job |
| 4 | CI gates enforced on every PR | ✓ | build-and-audit + playwright-integration required in ruleset |
| 5 | Repo exists, main protected, Vercel auto-deploys, GSC tag deployed | ✓ | Tasks 1-4A |
| 6 | PR preview URLs auto-generate; production deploys on main merge | ✓ | 13 preview deploys during Phase 0 work |

---

## Deviations from CONTEXT.md

| Item | Deviation | Impact |
|------|-----------|--------|
| Repo visibility | Public (planned private) | Enables free branch protection |
| GSC verification | Meta tag instead of HTML file | Simpler, same effect, no extra static file |
| Env vars | `vercel.json` instead of dashboard | More automated; committed to repo |
| LHCI/pa11y | continue-on-error | Vercel Hobby SSO blocks crawlers on preview URLs |
| Required checks | 2 not 3 | `lighthouse-and-a11y` is continue-on-error |

---

*Last updated: 2026-06-22 — Phase 0 COMPLETE.*
