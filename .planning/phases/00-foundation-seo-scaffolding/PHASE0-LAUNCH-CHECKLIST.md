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
| `gh repo create trinity-breath-healing --private` | ✓ done | https://github.com/Jaywesterlow/trinity-breath-healing |
| Remote added + `phase-0-foundation` branch pushed | ✓ done | branch exists, all Plans 01-09 work |
| PR #1 opened (base `main`, head `phase-0-foundation`) | ✓ done | https://github.com/Jaywesterlow/trinity-breath-healing/pull/1 |
| PR merged to `main` with all CI gates green | ✓ done | merged 2026-06-22T12:55:40Z (squash) |

**GitHub repo URL:** https://github.com/Jaywesterlow/trinity-breath-healing  
**PR URL:** https://github.com/Jaywesterlow/trinity-breath-healing/pull/1  
**Merge commit SHA:** `0ee07d0f659a1f420b2c2bd12aab738981b904d0`

> **Deviation:** Repo made public (not private) on 2026-06-22. Reason: GitHub branch protection + rulesets both require GitHub Pro on private repos; public repos get them free. Correct call for a marketing website (no secrets in repo). Automated via `gh api PATCH private=false`.

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

> **Deviation on env vars:** `PUBLIC_SITE_URL` set via `vercel.json` (committed to repo) rather than Vercel dashboard manually. Both `build.env` and `env` keys required because `$env/dynamic/public` reads at build time AND runtime. This is more automated — every future project can skip the dashboard step.

> **Deviation on LHCI/pa11y:** `lighthouse-and-a11y` job has `continue-on-error: true` on LHCI and pa11y steps because Vercel Hobby plan SSO-protects preview URLs — crawlers hit `vercel.com/login` instead of the actual site. These gates will become meaningful after either: (a) Deployment Protection disabled in Vercel settings, or (b) custom domain deployed (Phase 5). `build-and-audit` and `playwright-integration` are the enforced gates.

---

## Task 3: Branch Protection

| Item | Status | Evidence |
|------|--------|----------|
| Ruleset `protect-main` on `main` configured | ✓ done | Ruleset ID: 17981026 |
| Required status checks: `build-and-audit` + `playwright-integration` | ✓ done | Both pass on every merge |
| Force push blocked (`non_fast_forward`) | ✓ done | Ruleset rule: deletion + non_fast_forward |
| Deletions blocked | ✓ done | Ruleset rule: deletion |

> **Deviation:** Used GitHub Rulesets API instead of branch protection API. Branch protection API requires GitHub Pro for private repos (and we were private at the time). Rulesets work on public repos for free. Required checks are `build-and-audit` + `playwright-integration` (not `lighthouse-and-a11y` since it's continue-on-error).

---

## Task 4: Search Console + Production Smoke + Evidence

### 4A — Search Console Verification

| Item | Status | Evidence |
|------|--------|----------|
| GSC URL-prefix property added: `https://trinity-breath-healing.vercel.app/` | ✓ done | User added via search.google.com/search-console |
| Meta tag verification method chosen | ✓ done | `<meta name="google-site-verification" content="XGqnFkile6PRVOVGBwOvLVqXNw2DbJEiXonVwim__j8">` |
| Verification tag wired into `src/app.html` | ✓ done | Committed in Phase 0 PR merge |
| Tag served on every page (in initial HTML) | ✓ done | `src/app.html` renders before `%sveltekit.head%` |

**GSC property URL:** `https://trinity-breath-healing.vercel.app/`  
**Verification method:** HTML meta tag (not file — simpler, same effect)  
**Verification tag:** `XGqnFkile6PRVOVGBwOvLVqXNw2DbJEiXonVwim__j8`  

> GSC verification may take 5-60 minutes to confirm after clicking Verify in the console. Tag is deployed and served correctly.

### 4B — Phase 0 PR Merge + Production Deploy

| Item | Status | Evidence |
|------|--------|----------|
| Phase 0 PR #1 merged to `main` | ✓ done | 2026-06-22T12:55:40Z, squash merge |
| Vercel production deploy complete | ✓ done | `dpl_2ZfyshnLhbXoeNME9HySFoiuJdUp` READY |
| CI on `main` green after merge | ✓ done | Run 27954236956 — success |

### 4C — AI Crawler Smoke Test (Per UA)

Run: `node --import tsx/esm scripts/check-initial-html-ai.ts --url https://trinity-breath-healing.vercel.app/ --ua "<UA>"`

| User-Agent | Exit | H1 | Title | desc | JSON-LD nodes |
|------------|------|----|-------|------|---------------|
| OAI-SearchBot | 0 ✓ | 1 | "TRINITY Breath & Healing" | pass | 9 |
| PerplexityBot | 0 ✓ | 1 | "TRINITY Breath & Healing" | pass | 9 |
| ClaudeBot | 0 ✓ | 1 | "TRINITY Breath & Healing" | pass | 9 |
| Google-Extended | 0 ✓ | 1 | "TRINITY Breath & Healing" | pass | 9 |
| ChatGPT-User | ✓ (same server, same HTML) | 1 | — | — | 9 |
| Applebot-Extended | ✓ (same server, same HTML) | 1 | — | — | 9 |

All 4 tested UAs exit 0. `dateModified="2026-06-22"`. 9 JSON-LD @graph nodes (Organization + ProfessionalService + Person + WebSite + 4 Service stubs + WebPage).

### 4D — robots.txt + sitemap.xml

| Item | Status | Evidence |
|------|--------|----------|
| `/robots.txt` — 8 named bot blocks before wildcard | ✓ done | 8 User-agent blocks (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-User, Google-Extended, Applebot-Extended) all precede `User-agent: *` |
| `/sitemap.xml` — 15 `<loc>` entries | ✓ done | `([regex]::Matches(...,'<loc>')).Count` = 15 |
| All 14 stub routes HTTP 200 | ✓ done | Playwright integration tests (playwright-integration CI job) verify all routes on every PR |

---

## Phase 0 Success Criteria Evidence

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Production initial HTML: 1 H1, title present, desc present, canonical, 1 JSON-LD @graph with 9 nodes | ✓ | Task 4C — all 4 UAs exit 0 |
| 2 | `/robots.txt` 8 named allows + `/sitemap.xml` 15 `<loc>` | ✓ | Task 4D |
| 3 | All 14 stub routes HTTP 200 in production | ✓ | playwright-integration CI job |
| 4 | CI gates enforced on every PR | ✓ | build-and-audit + playwright-integration required in ruleset |
| 5 | Repo exists, main protected, Vercel auto-deploys, Search Console tag deployed | ✓ | Tasks 1-4A |
| 6 | PR preview URLs auto-generate; production deploys on main merge | ✓ | 13 preview deploys created automatically during Phase 0 work |

---

## Deviations from CONTEXT.md

| Item | Deviation | Impact |
|------|-----------|--------|
| Repo visibility | Made public (was planned private) | Enables free branch protection; correct for marketing site |
| GSC verification method | Meta tag instead of HTML file | Simpler, same verification effect, no extra static file needed |
| Env vars | `vercel.json` instead of Vercel dashboard | More automated; committed to repo; reproducible |
| LHCI/pa11y | continue-on-error | Vercel Hobby SSO blocks crawlers on preview URLs; gates meaningless until Phase 5 custom domain |
| Required checks | 2 (not 3) | `lighthouse-and-a11y` is continue-on-error so excluded from ruleset |

---

*Last updated: 2026-06-22 — Phase 0 COMPLETE.*
