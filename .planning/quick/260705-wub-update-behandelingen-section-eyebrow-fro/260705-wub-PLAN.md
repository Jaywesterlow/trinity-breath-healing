---
phase: quick
plan: 260705-wub
type: execute
wave: 1
depends_on: []
files_modified: [src/lib/components/global/Behandelingen.svelte]
autonomous: true
requirements: []
must_haves:
  truths:
    - "Behandelingen section eyebrow reads 'Diensten', not 'Werkwijze'"
    - "Behandelingen section heading is unique copy describing the services carousel, not the Werkwijze process copy"
  artifacts:
    - path: "src/lib/components/global/Behandelingen.svelte"
      provides: "Updated eyebrow + heading text for the services/treatments section"
  key_links: []
---

<objective>
Fix copy-paste leftover in `Behandelingen.svelte`: the section eyebrow ("Werkwijze") and heading ("Rustig, persoonlijk en op jouw tempo.") were verbatim-copied from `Werkwijze.svelte` and describe the *process* section, not the services/treatments carousel this component actually renders (Mahatma Healing, Goldhealing, Raster Energie, Spinal Touch).

Purpose: Each landing section must have distinct, accurate copy — duplicate text across two sections is confusing for users and a content-quality signal search engines/AI crawlers can penalize (thin/duplicate content).

Output: `Behandelingen.svelte` with a "Diensten" eyebrow and a new H2 heading that correctly frames the services list.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/lib/components/global/Behandelingen.svelte
@src/lib/constants/brand.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace eyebrow and heading copy in Behandelingen.svelte</name>
  <files>src/lib/components/global/Behandelingen.svelte</files>
  <action>
Edit lines 37-38 only. Do not touch script logic, markup structure, icon map, or the `<style>` block.

Line 37: change `<p class="treatments__eyebrow">Werkwijze</p>` to `<p class="treatments__eyebrow">Diensten</p>`.

Line 38: change `<h2 class="treatments__heading">Rustig, persoonlijk en op jouw tempo.</h2>` to `<h2 class="treatments__heading">Vier behandelingen, één doel: jouw herstel.</h2>`.

Rationale for the new heading: it names the plurality of services shown in the carousel (Mahatma Healing, Goldhealing, Raster Energie, Spinal Touch — from `BRAND.services` in `src/lib/constants/brand.ts`) without repeating the Werkwijze section's "rustig, persoonlijk, op jouw tempo" process framing. Tone matches the site's warm, calm Dutch voice (short declarative sentence, second-person "jouw", no jargon). Remains a real semantic `<h2>` — no placeholder text, no lorem ipsum, Dutch language preserved, no change to heading hierarchy (still H2 following the page's single H1 in Hero).

Do not introduce any English text, do not add a `TBD_` placeholder, do not change the eyebrow/heading CSS classes (`treatments__eyebrow`, `treatments__heading`) since their styles in the `<style>` block reference those exact class names.
  </action>
  <verify>
    <automated>node -e "const fs=require('fs');const t=fs.readFileSync('src/lib/components/global/Behandelingen.svelte','utf8');const okEyebrow=/treatments__eyebrow\">Diensten</.test(t);const okHeading=!/Rustig, persoonlijk en op jouw tempo\./.test(t) && /<h2 class=\"treatments__heading\">[^<]+<\/h2>/.test(t);const noWerkwijzeEyebrow=!/treatments__eyebrow\">Werkwijze</.test(t);if(!okEyebrow||!okHeading||!noWerkwijzeEyebrow){console.error('FAIL', {okEyebrow, okHeading, noWerkwijzeEyebrow});process.exit(1)}console.log('PASS')"</automated>
  </verify>
  <done>Behandelingen.svelte eyebrow reads "Diensten" and the H2 heading is distinct from Werkwijze.svelte's heading, still valid Dutch prose in a real `<h2>` tag. No other lines in the file changed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

None — this is a static copy edit to a Svelte component with no user input, no external data, no new dependencies.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | Tampering | src/lib/components/global/Behandelingen.svelte | accept | Copy-only change, no logic/markup/style structure touched, no user-controlled input involved |
</threat_model>

<verification>
1. Run the automated node check above — confirms eyebrow text and heading text changed as specified.
2. `git diff src/lib/components/global/Behandelingen.svelte` shows only lines 37-38 changed (no script, style, or other markup touched).
3. Visual spot-check (optional): `npm run dev` and view the Behandelingen section — eyebrow reads "Diensten", heading is the new sentence, carousel of 4 service cards still renders and scrolls.
</verification>

<success_criteria>
- Eyebrow text is "Diensten" (was "Werkwijze")
- Heading text is new, services-appropriate Dutch copy (was the Werkwijze process copy)
- No other file modified
- No placeholder/TBD text introduced
- Component still compiles (svelte-check clean) and section still renders 4 service cards
</success_criteria>

<output>
Create `.planning/quick/260705-wub-update-behandelingen-section-eyebrow-fro/260705-wub-SUMMARY.md` when done
</output>
