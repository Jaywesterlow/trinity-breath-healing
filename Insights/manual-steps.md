# Manual Steps — What Required Human Action and Why

Every item here is something I asked you (the user) to do, or something that could not be
automated. Each entry documents: what the step was, why it required human action, and why I
could not do it myself.

The goal of this log is to track the friction points in the workflow so future projects can
reduce or eliminate them.

---

## 1. Vercel — Initial Project Creation

**What you did:** Went to vercel.com → "Add Project" → imported `trinity-breath-healing` from
GitHub → clicked Deploy.

**Why it required you:** Vercel's "create project from a GitHub repo" flow requires an OAuth
browser session authenticated as the repo owner. There is no public API endpoint that creates
a Vercel project without an already-issued project-scoped deploy token — which itself only
exists after the project is created. Classic chicken-and-egg problem.

**What I automated after:** `vercel.json` committed to the repo with `build.env` and `env`
blocks sets `PUBLIC_SITE_URL` for every future deploy automatically. No Vercel dashboard
visits needed for env vars or build settings. The Vercel MCP plugin handles all read/status
operations (deploy status, logs, preview URLs) without requiring you to open a browser.

**Future automation potential:** Install the Vercel CLI (`npm i -g vercel`) and run
`vercel link` once per machine. After that, `vercel deploy` from the terminal is fully
automated and scriptable.

---

## 2. Google Search Console — Property Verification

**What you did:**
1. Went to search.google.com/search-console
2. Added property → URL prefix → `https://trinity-breath-healing.vercel.app`
3. Chose "HTML tag" verification method
4. Copied the `content` value from the `<meta name="google-site-verification" ...>` tag
5. Pasted it into this conversation

**Why it required you:** Google Search Console has no public API for adding a new property or
generating a verification token. The entire flow is gated behind a Google OAuth session. There
is no service-account path or API key that lets a third-party agent create a property on your
behalf — Google deliberately requires the property owner to authenticate interactively.

**What I automated after:** Wired the verification tag directly into `src/app.html` and
committed it. Every future deploy automatically includes the tag — you will never need to
re-verify unless you switch Google accounts or move to a custom domain (which would require
re-verification for the new domain anyway).

**Future automation potential:** None. Google's verification policy requires human OAuth by
design. This is a one-time step per site per domain.

---

## 3. Making the GitHub Repo Public

**What you did:** Confirmed "make it public" when I asked for permission.

**Why it required your confirmation (not action):** Making a repository public is an
irreversible-ish change — once public, any forks made by others persist even if you make it
private again. I treat this as a decision requiring explicit user sign-off before acting, not
something I should do silently.

**What I automated:** Ran `gh api repos/.../repository --method PATCH --field private=false`
— one API call, no browser required. You said one word ("make it public") and I handled the
rest.

**Why branch protection required this:** GitHub's branch protection and ruleset APIs return
403 on private repos for free accounts. Public repos unlock both for free. Since this is a
marketing website (no secrets in the repo), public is correct.

---

## Notes on the Automation Boundary

The pattern across all three items above:

- **Account authorization** (Vercel OAuth, Google OAuth, GitHub decision) = always requires
  the human. These are identity gates by design — the platforms will not let a third-party
  agent act as you without your credential.
- **Everything after the credential gate** = automatable. Config files, API calls, git
  commits, CI pipelines, branch rules — all handled without manual steps.

The goal for future projects: reduce the human-gated steps to the absolute minimum (usually
just the first OAuth login per service), then automate everything downstream.
