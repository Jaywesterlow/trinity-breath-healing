# Phase 0 Launch Checklist

**Phase:** 00 — Foundation & SEO Scaffolding  
**Plan:** 09 — Human Checkpoints (GitHub + Vercel + Search Console)  
**Date started:** 2026-06-20  
**Status:** IN PROGRESS

---

## Task 1: GitHub Repo + Phase 0 PR

| Item | Status | Evidence |
|------|--------|----------|
| `gh repo create trinity-breath-healing --private` | pending | — |
| Remote added + `phase-0-foundation` branch pushed | pending | — |
| PR opened (base `main`, head `phase-0-foundation`) | pending | — |
| `gh repo view` returns `"visibility":"PRIVATE"` + `"defaultBranchRef":{"name":"main"}` | pending | — |

**GitHub repo URL:** _TBD_  
**PR URL:** _TBD_  
**PR head commit SHA:** _TBD_

---

## Task 2: Vercel Project + Env Vars

| Item | Status | Evidence |
|------|--------|----------|
| Vercel project created, linked to `trinity-breath-healing` GitHub repo | pending | — |
| `PUBLIC_SITE_URL` = `https://trinity-breath-healing.vercel.app` set for Production | pending | — |
| `PUBLIC_SITE_URL` = `https://trinity-breath-healing.vercel.app` set for Preview | pending | — |
| Phase 0 PR preview deploy succeeds (Vercel bot comment on PR) | pending | — |
| Preview URL `/`, `/robots.txt`, `/sitemap.xml` all load correctly | pending | — |
| `lighthouse-and-a11y` CI job passed against preview URL | pending | — |
| Vercel Deployment Protection (preview noindex) enabled | pending | — |

**Vercel project URL:** _TBD_  
**Preview URL (Phase 0 PR):** _TBD_  
**Production URL:** `https://trinity-breath-healing.vercel.app`  
**CI workflow run URL:** _TBD_

> **Note on preview noindex:** Recommended approach — enable Vercel Deployment Protection's "noindex" toggle on preview deployments (vendor-managed, zero code surface vs. toggling meta.noindex in Plan 02). Document deviation here if different approach chosen.

---

## Task 3: Branch Protection

| Item | Status | Evidence |
|------|--------|----------|
| Branch protection rule on `main` configured | pending | — |
| Require PR before merge: yes | pending | — |
| Required status checks: `build-and-audit`, `lighthouse-and-a11y`, `playwright-integration` | pending | — |
| Require branches up to date: yes | pending | — |
| Force push blocked: yes | pending | — |
| `gh api` protection endpoint returns 3 required contexts | pending | — |

**`gh api` output (jq .required_status_checks.contexts):**
```
_TBD — paste output here_
```

---

## Task 4: Search Console + Production Smoke + Evidence

### 4A — Search Console Verification

| Item | Status | Evidence |
|------|--------|----------|
| GSC URL-prefix property added: `https://trinity-breath-healing.vercel.app/` | pending | — |
| HTML-file verification method chosen | pending | — |
| Verification file downloaded from GSC | pending | — |
| `static/google<hash>.html` committed + PR merged | pending | — |
| File accessible at `https://trinity-breath-healing.vercel.app/google<hash>.html` | pending | — |
| GSC "Verify" clicked | pending | — |
| GSC status | pending | — |

**Verification file name:** _TBD (e.g. `google1a2b3c4d5e6f.html`)_  
**GSC property URL:** `https://trinity-breath-healing.vercel.app/`  
**GSC verification status:** _TBD (Ownership verified / In progress)_

### 4B — Phase 0 PR Merge + Production Deploy

| Item | Status | Evidence |
|------|--------|----------|
| Phase 0 PR merged to `main` with all CI gates green | pending | — |
| Vercel production deploy complete | pending | — |
| Production URL `https://trinity-breath-healing.vercel.app/` returns HTTP 200 | pending | — |

### 4C — AI Crawler Smoke Test (Per UA)

Run: `npx tsx scripts/check-initial-html-ai.ts --url https://trinity-breath-healing.vercel.app/ --ua "<UA>"`

| User-Agent | Exit code | H1 | Title chars | Description chars | Canonical | JSON-LD @graph |
|------------|-----------|----|-----------|--------------------|-----------|----------------|
| OAI-SearchBot | pending | — | — | — | — | — |
| ChatGPT-User | pending | — | — | — | — | — |
| PerplexityBot | pending | — | — | — | — | — |
| ClaudeBot | pending | — | — | — | — | — |
| Google-Extended | pending | — | — | — | — | — |
| Applebot-Extended | pending | — | — | — | — | — |

### 4D — robots.txt + sitemap.xml + Stub Routes

| Item | Status | Evidence |
|------|--------|----------|
| `/robots.txt` — 8 named bot blocks before wildcard | pending | — |
| `/sitemap.xml` — 15 `<loc>` entries | pending | — |
| All 14 stub routes return HTTP 200 | pending | — |

**`grep -c '<loc>'` output from sitemap.xml:** _TBD_

---

## Phase 0 Success Criteria Evidence

| # | Criterion | Status | Evidence reference |
|---|-----------|--------|-------------------|
| 1 | Production initial HTML: 1 H1, 50-60 char title, 150-160 char desc, canonical, 1 JSON-LD @graph with 7+ nodes | pending | Task 4C table |
| 2 | `/robots.txt` 8 named allows + `/sitemap.xml` 15 `<loc>` | pending | Task 4D |
| 3 | All 14 stub routes HTTP 200 in production | pending | Task 4D |
| 4 | CI gates enforced (Plans 01-08 tests pass on every PR) | pending | CI workflow URL |
| 5 | GitHub repo private + main protected, Vercel auto-deploys, Search Console verification initiated | pending | Tasks 1-4 |
| 6 | PR preview URLs auto-generate; production deploys on main merge | pending | Task 2 + 4B |

---

## Deviations & Notes

_Document any deviations from CONTEXT.md here as they occur._

- [ ] Preview env var approach: using production URL for preview canonical (Phase 0 stub-only — acceptable, document if changed)
- [ ] Vercel Deployment Protection noindex for previews: recommended enabled — document if skipped

---

## Follow-up PRs

| PR | Purpose | Status |
|----|---------|--------|
| Phase 0 main PR (`phase-0-foundation`) | Plans 01-08 work | pending merge |
| GSC + checklist PR | `static/google<hash>.html` + this checklist file | pending |

---

*Last updated: 2026-06-20*
