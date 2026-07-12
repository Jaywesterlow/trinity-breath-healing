---
slug: nav-cta-component
date: 2026-06-29
status: in-progress
---

# Nav CTA Component

Remove social icon from Nav.svelte and extract CTA button into NavCta.svelte component.

## Tasks

- [ ] Create `NavCta.svelte` — wraps Button with nav__cta styles + responsive visibility
- [ ] Remove social icon `<a>` + `.nav__social-btn` CSS from Nav.svelte
- [ ] Update Nav.svelte to import and use `<NavCta />`
- [ ] Export NavCta from `index.ts`
