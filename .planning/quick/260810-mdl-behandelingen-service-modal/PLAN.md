# 260810-mdl — Behandelingen: seven real services, cards open a modal

Quick task. Owner-approved design, 2026-08-10.

## Why

Three things land together because they are the same change:

1. The practitioner sent her real service copy by text. The carousel currently shows 4 services
   with `TODO_` descriptions plus a "Meer diensten" nav card. It should show **7 real services**
   and nothing else — a "more services" card inside a carousel of all the services is nonsense.
2. `infinity.png` on Raster Energie is **not** the owner's artwork and must go. Only 3 of the 7
   services have real art. The other 4 show a **number** in the icon's place until art arrives.
3. Clicking the centre card should open a **near-fullscreen modal** that expands out of the card,
   not navigate away.

## Owner decisions (do not relitigate)

- 7 cards, one per service. No "Meer diensten" card.
- BRTT and TRB are **separate** services with separate cards, modals and pages.
- Raster Energie loses `infinity.png` and shows a number.
- The number appears **only where art is missing** — driven by absence from the `ICONS` map, not
  by a flag. Drop art in later and the number disappears on its own.
- Modal copy is an *interpretation* of her text, not a paste of it. Structure: title, intro
  paragraph, "helpt bij" list, her image centred with copy left and right.
- New `/diensten/<slug>` pages get created for real. **The sitemap must stay honest** — every
  linked slug resolves.

## Scope

### 1. `src/lib/constants/brand.ts` — the data

Replace the 4-entry `services` array with 7 entries. Each entry gains three fields beyond
`slug`/`name`. Keep `as const`.

- `teaser` — one sentence. Card hover reveal. Replaces the `TODO_ ` `description` field; **rename
  the field** and update every reader (`Behandelingen.svelte`, any Service schema emitter, tests).
- `intro` — the modal's paragraph under the title.
- `helpsWith: string[]` — the modal's list.

Copy below is final. Dutch, her voice, no invented claims. Do not embellish it.

---

**1. `mahatma-healing` — Mahatma Healing**

- teaser: `Krachtige, harmoniserende energie die blokkades opheft en je energetisch systeem opschoont.`
- intro: `Voorafgaand aan een sessie stem ik af op jouw I AM Presence, jouw Hogere Zelf, zodat ik intuïtief weet welke energie nodig is. Als Mahatma Coach faciliteer ik de Mahatma energie, die harmoniserend en balancerend werkt. Oude energie mag los, zodat er ruimte komt voor nieuwe energie en alles weer kan stromen vanuit je eigen kracht.`
- helpsWith: `stress`, `burn-out`, `vermoeidheidsklachten`, `angsten`, `slaapproblemen`, `ADHD`,
  `trauma`, `allergieën`, `rouwverwerking`

**2. `goldhealing` — Goldhealing**

- teaser: `Gouden lichtenergie die negativiteit omzet, beschermt en vooral op het psychische vlak werkt.`
- intro: `Goldhealing stemt je af op een van de sterkst transformerende energiestralen uit de kosmos. Het gouden licht zet negatieve gevoelens en gedachten om en blijft je na de behandeling omringen als bescherming. Ik combineer het vaak met de Mahatma of Kundalini energie, zodat zowel de bron als de klacht wordt aangeraakt. Ook heel geschikt voor kinderen.`
- helpsWith: `angstgevoelens`, `negativiteit en depressieve klachten`, `stress en overprikkeling`,
  `hooggevoeligheid bij kinderen`, `ADHD`, `autisme en PDD-NOS`

**3. `raster-energie` — Raster Energie**

- teaser: `Herstel van je Goddelijke blauwdruk — energetische stempels en blokkades worden gereinigd.`
- intro: `Rond je auraveld ligt een geometrische structuur, verbonden met de axitonale en galaxitonale lijnen. Samen vormen die je blauwdruk, en daarmee je verbinding met je Hogere Zelf. Invloeden van buitenaf kunnen daar stempels en blokkades op achterlaten. De rasterenergie heeft een hoge trillingsfrequentie en herbedraadt je als het ware, zodat je originele blauwdruk hersteld wordt.`
- helpsWith: `energetische blokkades`, `karmische belasting`, `herstel van je aura`,
  `heling op mentaal, emotioneel en fysiek niveau`, `activeren van je zelfgenezend vermogen`,
  `inzicht en bewustwording`

**4. `cranio-fascia-unwinding` — Cranio & Fascia Unwinding**

- teaser: `Zacht lichaamswerk waarbij je lichaam zelf het tempo bepaalt en opgeslagen spanning loslaat.`
- intro: `Met lichte aanraking en subtiele cranio-technieken nodig ik je zenuwstelsel en je fascia uit om spanning los te laten die er vaak al langer zit. Je lichaam kan spontaan gaan bewegen, zuchten, trillen of juist heel stil worden: fascia unwinding, een natuurlijk ontladingsproces waarbij oude spanning veilig losgelaten wordt, zonder forceren. Er is geen moeten, alleen uitnodiging.`
- helpsWith: `langdurige stress en burn-outklachten`, `spanning die niet verdwijnt met praten of sporten`,
  `vermoeidheid, onrust en overprikkeling`, `moeite met voelen of ontspannen`,
  `emotionele verwerking na intensieve periodes`

**5. `spinal-touch` — Spinal Touch**

- teaser: `Zachte methode langs de wervelkolom die je centrale zenuwstelsel weer laat doorstromen.`
- intro: `Stress en trauma slaan zich op aan de achterzijde van je lichaam en kunnen zich daar inkapselen. De blokkades die zo ontstaan houden signalen tussen je centrale zenuwstelsel en je organen, spieren en weefsels tegen. Via lichte aanraking op specifieke punten langs je wervelkolom geef ik subtiele signalen aan dat zenuwstelsel. Geschikt voor alle leeftijden, van pasgeborenen tot ouderen.`
- helpsWith: `rugpijn en hernia`, `hoofdpijn en migraine`, `angsten en depressieve klachten`,
  `burn-outklachten`, `gewrichtspijn en fibromyalgie`, `spijsverteringsklachten`,
  `(chronische) vermoeidheid`, `slaapproblemen`, `tinnitus`

**6. `brtt-body` — BRTT Body**

- teaser: `Lichaamsgericht proces dat via de psoas — de spier van de ziel — opgeslagen trauma bevrijdt.`
- intro: `BRTT, Body Release Trauma Therapy, is een krachtig lichaamsgericht proces dat opgeslagen trauma, heftige gebeurtenissen en stress uit je lichaam bevrijdt. Met gevarieerde technieken activeren we de psoas-spier, ook wel de spier van de ziel genoemd. Het lichaam mag ontladen, je zenuwstelsel kalmeert en lagen van lichaamspantsering laten los.`
- helpsWith: `PTSS-symptomen`, `chronische spanning en pantsering`,
  `burn-outklachten en depressieve gevoelens`, `migraine, rug-, nek- en schouderklachten`,
  `ontspanning van de bekkenbodem`, `slaapkwaliteit`, `veerkracht`

**7. `trb-breathwork` — Trauma Release Breathwork**

- teaser: `Zeven ademtechnieken die de poort naar je onderbewuste openen en oude lading loslaten.`
- intro: `TRB is een diepgaande vorm van ademwerk. Via zeven ademtechnieken maak je verbinding met de kern van je overtuigingen en ervaringen. De sessie brengt je in een diepe, soms trance-achtige staat waarin opgeslagen emoties en trauma's veilig losgelaten of gereset mogen worden — ook ervaringen waar je geen bewuste herinnering meer aan hebt.`
- helpsWith: `onverwerkte trauma's`, `onderdrukte emoties`, `angst en depressieve gevoelens`,
  `spanning vastgezet in het lichaam`, `verankering en aarding`, `diepe ontspanning en rust`

---

**Shared disclaimer**, rendered once in the modal footer and once per service page. Her words,
condensed: `Een behandeling vervangt nooit reguliere zorg en ik stel geen diagnose. Bij fysieke klachten ga je altijd eerst naar de huisarts.`

Add it as `BRAND.disclaimer` — a single constant, not seven copies.

### 2. Icons

`ICONS` in `Behandelingen.svelte` keeps exactly three entries: `mahatma-healing`,
`goldhealing`, `spinal-touch`. **Delete the `raster-energie` → `infinity.png` mapping.** Do not
delete `static/images/infinity.png` in this task; just stop referencing it.

Services absent from `ICONS` render a number in the icon slot — `TreatmentCard` takes a
`number?: number` prop, and `Behandelingen.svelte` passes `i + 1` only when `icon` is null. The
number uses the display font at the size the icon art occupies; it is content, not decoration,
so it is **not** `aria-hidden` — but it must not double-announce, so keep the card's
`aria-label` as the source of truth and mark the number `aria-hidden="true"`.

### 3. Carousel at 7

`count = 7` → `HIGH_SLOT = 3`, `LOW_SLOT = -3`, visible range ±2. Slots ±3 are off-screen, so the
recycle invariant holds and `REPEATS` collapses to 1. **Verify this by reading the computed
values, don't assume it.**

One latent bug to fix while here: `MIN_ITEMS = 2 * VISIBLE_SLOT_MAX + 2` is wrong for an **even**
base count. At `count = 6` it yields `LOW_SLOT = -2`, which is a *visible* slot — every step would
teleport a card in full view, the exact failure `e3ad763` fixed for 5. Change to
`2 * VISIBLE_SLOT_MAX + 3` and leave a comment saying why the `+3` (the extra slot of an even
count lands on the positive side, so the negative side needs the margin). Harmless at 7, correct
at any count.

Dots go 4 → 7. Check they still fit at 390px; tighten gap if not.

### 4. The modal — `ServiceModal.svelte` (new, `src/lib/components/ui/`)

**Markup.** One native `<dialog>`, rendered once in `Behandelingen.svelte`. All 7 bodies are
prerendered inside it; inactive ones carry `hidden`. Native `<dialog>` + `showModal()` gives focus
trap, Esc, background inert and focus restore for free — the `pa11y-ci` gate is in CI and
hand-rolling those is how it fails.

Do **not** build the content from JS at open time. Every service's text must be in the initial
HTML; this site is judged on AI-crawler readability first.

**Layout.** Desktop: three columns — title + intro left, image (or number) centred, `helpt bij`
list right. Mobile: stacked title → intro → image → list. Disclaimer in the footer either way.

**Four buttons:**

- **Prev**, vertically centred against the modal's left edge.
- **Next**, vertically centred against the right edge.
  Both switch the modal to the adjacent service and wrap. Opening Mahatma Healing and pressing
  Next lands on Goldhealing. **The carousel underneath follows** — call the existing
  `goTo(index)` so closing the modal leaves the matching card centred. Reuse the existing spring
  constants; do not add a new one.
- **Close.**
- **Naar de pagina** — a real `<a href="/diensten/<slug>">` to that service's page.

**Open animation.** In order:

1. the card's inner content fades out (~150ms);
2. the dialog appears matched exactly to the card's `getBoundingClientRect()` — same background,
   same border radius — then grows to near-fullscreen (~400ms);
3. the modal's own content fades in.

Close reverses it. The card never leaves the fan, so nothing tears a hole in the carousel: the
dialog is a lookalike that starts life at the card's size. Drive it with the **Web Animations
API**, not `style.transition` — `reveal.ts` documents why (setting `transition` clobbers whatever
the element's stylesheet declared, which silently broke the FAQ close animation once).

Under `prefers-reduced-motion`: open and close instantly, no growth, no fade. Test it, don't
assume it.

**Which cards open it.** Centre card only (`positions[i] === 0`). Side cards keep click-to-jump —
that is what makes the rect maths honest, since the centre card is the one card the fan does not
rotate. Mobile centre tap opens the modal too, replacing today's navigate-away. The existing
post-drag click suppression (`onFanClickCapture`) already covers "I dragged, don't treat that as a
tap" — reuse it, do not add a second guard.

**The link survives.** The card stays `<a href="/diensten/<slug>">` in the markup; the handler
calls `preventDefault()`. Crawlers and JS-off visitors reach the page.

### 5. New pages + sitemap

Three new routes, mirroring the four that exist (`StubLayout`, `+page.ts`, `+page.svelte`):

- `/diensten/cranio-fascia-unwinding`
- `/diensten/brtt-body`
- `/diensten/trb-breathwork`

Each needs an entry in **both** `src/lib/constants/routes.ts` (`kind: 'service-stub'`) and
`src/lib/seo/stub-meta.ts` (title, description, crumbs). Follow the existing entries exactly,
including the `// title: N chars ✓  desc: N chars ✓` comment — **count the characters, don't copy
the numbers.** Titles ≤ 60, descriptions 150–160.

`ALL_ROUTES` drives the sitemap, so all three land in it automatically. Verify: build, then
confirm the sitemap lists 7 service URLs and every one resolves.

## Out of scope

- Filling the seven service pages with real content. They stay stubs; the data now exists in
  `brand.ts` for whoever does that next.
- Deleting `static/images/infinity.png`.
- Art for the four services that lack it.

## Tests

Playwright, alongside the five existing `behandelingen-*` specs:

- centre card click opens the modal with that service's title;
- Prev/Next move to the adjacent service and wrap at both ends;
- the carousel underneath ends up centred on the service the modal was showing when closed;
- Esc, the close button and a backdrop click all close it, and focus returns to the card;
- a drag that ends over the centre card does **not** open the modal;
- every card carries a real `href`;
- `prefers-reduced-motion` open/close is instant.

Unit: `brand.ts` has 7 services, every slug has a matching route in `ALL_ROUTES` and an entry in
`STUB_META`, no `TODO_` remains in `services`.

**Run Prettier on every new test file before committing.** Three separate "Fix CI" commits on the
last branch were all this same mistake.

## Verification

- `npm run test` (vitest) green.
- `npx svelte-check` 0 errors.
- `PUBLIC_SITE_URL=… npm run build` green.
- `npm run audit:placeholders` — the seven `TODO_` service descriptions are gone; `TODO_PHONE`
  remains and is expected.
- `npm run audit:json-ld` and `npm run audit:html` green.
- Playwright specs green (see the override-config note in `HANDOFF.md` → Environment gotchas).

## Commits

Atomic, one concern each, in this order. Push after each — the owner reviews on Vercel previews
from a phone and cannot run a dev server.

1. `feat(brand): seven real services with practitioner copy`
2. `feat(diensten): pages, routes and metadata for the three new services`
3. `fix(behandelingen): drop infinity.png, number the cards without art`
4. `fix(behandelingen): widen the hidden-slot margin for even card counts`
5. `feat(behandelingen): service modal, expanding out of the centre card`
6. `test(behandelingen): cover the service modal`
