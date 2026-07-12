---
status: testing
phase: 01-landing-sections
source:
  - 01-00-SUMMARY.md
  - 01-01-SUMMARY.md
  - 01-02-SUMMARY.md
  - 01-03-SUMMARY.md
  - 01-04-SUMMARY.md
  - 01-05-SUMMARY.md
  - 01-06-SUMMARY.md
  - 01-07-SUMMARY.md
  - 01-08-SUMMARY.md
  - 01-09-SUMMARY.md
started: "2026-06-25T00:00:00.000Z"
updated: "2026-06-25T00:00:00.000Z"
---

## Current Test

number: 1
name: Landing Page Loads
expected: |
  Run `npm run dev`, open http://localhost:5173.
  H1 "Rust in je hoofd. Ontspanning in je lichaam." visible.
  Hero image area rendered. "Maak een afspraak" CTA button present.
  3 service tile links below hero (Spinal Touch, Goldhealing, Diensten).
awaiting: user response

## Tests

### 1. Landing Page Loads
expected: Run `npm run dev`, open http://localhost:5173. H1 "Rust in je hoofd. Ontspanning in je lichaam." visible. Hero image area rendered. "Maak een afspraak" CTA button present. 3 service tile links below hero (Spinal Touch, Goldhealing, Diensten).
result: [pending]

### 2. Fixed Navigation — Desktop
expected: Fixed header visible at top of page. 5 nav links present: Home, Werkwijze, Over mij, Behandelingen, Contact. Scroll down → header hides. Scroll back up → header reappears.
result: [pending]

### 3. Mobile Overlay
expected: Resize browser to mobile width (<768px). Hamburger button visible top-right (44×44px touch target). Click hamburger → full-screen overlay opens with navigation links. Press Escape → overlay closes. X button also closes. Focus returns to hamburger after close.
result: [pending]

### 4. Section Anchor Nav
expected: Click "Werkwijze" in nav (or navigate to /#werkwijze). Page smooth-scrolls to Werkwijze section. H2 "Rustig, persoonlijk en op jouw tempo." visible. 3 accordion cards: Kennismaking, De sessie, Verdieping present.
result: [pending]

### 5. Werkwijze Accordion Behavior
expected: On mobile: click a Werkwijze card to expand it — body text appears. Clicking a different card collapses the first and expands the second. On desktop (≥1024px): all 3 cards are open simultaneously in row layout.
result: [pending]

### 6. About Section
expected: Scroll to About section. H2 "Vanuit eigen ervaring weet ik wat jij doormaakt." visible. Stats display: "8+" years and "65+" clients. "Lees meer over mij →" link present pointing to /over-mij.
result: [pending]

### 7. Behandelingen Carousel
expected: Section shows 5 treatment cards (Mahatma Healing, Goldhealing, Raster Energie, Spinal Touch, Meer diensten). On mobile: cards scroll horizontally. On desktop with JS: prev/next arrow buttons visible and cycle through cards without breaking layout.
result: [pending]

### 8. Contact Form
expected: Section with H2 "Een eerste stap hoeft niet groot te zijn." has email/online toggle. Email tab: form renders with firstName, lastName, email, phone, message fields + AVG consent checkbox + "Verstuur email" submit button. Switching to "Online afspraak" shows booking placeholder area.
result: [pending]

### 9. FAQ Section
expected: "Veelgestelde vragen" heading visible. At least 8 accordion items (Q&A pairs in Dutch). Click a question → answer text expands. Click a different question → first collapses, new one expands.
result: [pending]

### 10. Footer
expected: Footer shows info@trinitybnh.nl, 3 column headings (DIENSTEN / MENU / LEZEN), copyright "©Copyright 2026 Trinity Breath & Healing". Logo rendered. All footer links functional (no 404s on click).
result: [pending]

### 11. dateModified in DOM
expected: Open browser DevTools > Elements. Find exactly one `<time datetime="YYYY-MM-DD">` element on the page. The text content of the element equals its datetime attribute value (a date like "2026-06-25"). JSON-LD `<script type="application/ld+json">` contains a WebPage node whose `dateModified` matches the same date.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
skipped: 0
blocked: 0
pending: 11

## Gaps

[none yet]
