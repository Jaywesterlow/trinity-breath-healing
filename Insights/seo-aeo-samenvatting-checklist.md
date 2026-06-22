# SEO & AEO — Samenvatting + Volledige Checklist

Samenvatting van de koers *Website SEO & AEO*, ontdaan van alle Lovable- en Conductor-specifieke content. Het generieke principe achter "prerendering" en "monitoren/bijsturen" is behouden (vendor-neutraal), want dat geldt voor elke stack — inclusief SvelteKit. Aangevuld met punten die online geverifieerd zijn als bewezen werkend (bronnen onderaan).

---

## Deel 1 — De kern van de koers

### 1. De nieuwe realiteit
- SEO gaat niet meer over keywords stuffen, maar over **betekenis en autoriteit** communiceren naar mensen én machines.
- AI-systemen (ChatGPT, Perplexity, Google AI Overviews) beslissen of jouw site een betrouwbare bron is om te **citeren**. Word je niet herkend, dan word je overgeslagen — ook buiten de klassieke zoekresultaten.
- Verschil dat telt: **gevonden worden** (ranking) vs. **gekozen worden** (geciteerd als bron).
- Technische toegankelijkheid is de basis; contentstrategie is de differentiator.

### 2. Content-architectuur: een site is een kennissysteem
- **Landingspagina's** = commerciële autoriteit (hub per kernonderwerp).
- **Blogs** = actuele signalen + long-tail zichtbaarheid.
- **Kennisbank** = de "bron van waarheid" voor AI (definities, uitleg, Q&A).
- Deze drie versterken elkaar via interne links; los van elkaar werken ze niet.

### 3. Van losse pagina's naar topical authority
- Denk in **topics, niet in pagina's**. Kies 3–5 kernonderwerpen en behandel ze breed én diep.
- Eén goede pagina is niet genoeg: 15 pagina's rond één thema verslaan 1 lang artikel. Brede dekking = vertrouwen.
- Voordeel: nieuwe content rankt sneller zodra je autoriteit op het thema hebt.
- **Interne linking** is het contextnetwerk: het vertelt machines hoe je content samenhangt.
- Consistentie > creativiteit: voorspelbare structuur is voor AI makkelijker te modelleren.

### 4. De vaste SEO-checklist (techniek + content)
**Techniek per pagina:** unieke title (50–60 tekens), meta description (150–160), één unieke H1, beschrijvende korte URL, mobielvriendelijk, laadtijd < ~3s.
**Afbeeldingen:** alt-tekst, compressie (WebP), beschrijvende bestandsnamen, lazy-load alleen buiten de viewport.
**Content:** logische heading-hiërarchie (H1→H2→H3, niets overslaan), korte alinea's (3–4 zinnen), lijsten, kern in de eerste ~150 woorden, kernbegrippen definiëren, duidelijke claims, onderwerp volledig behandelen.
**AI-citeerbaarheid:** definitieve statements, specifieke en onderbouwde claims, heldere structuur, duidelijke auteur/bron.

### 5. Technische SEO voor JavaScript- & AI-sites
- Bots vragen eerst de **HTML** op. Bij client-side gerenderde JS-sites is die HTML vaak (bijna) leeg → content onzichtbaar.
- Google rendert JS wél, maar met vertraging en niet altijd foutloos. **De meeste AI-crawlers voeren geen JS uit.**
- Oplossing voor SEO-kritische pagina's: **SSR, SSG of prerendering** — zorg dat content + meta tags in de initiële HTML staan. (SvelteKit doet SSR/SSG native.)
- **Veelgemaakte fouten:** (1) belangrijke content alleen na JS, (2) SPA-routes zonder server-fallback → 404 op deeplinks, (3) hoofdcontent lazy-loaden, (4) meta tags pas via JS injecteren.

### 6. Structured data (Schema.org / JSON-LD)
- Maakt impliciete info expliciet voor machines. AI leunt er nog zwaarder op dan zoekmachines.
- Gebruik **JSON-LD**. Relevante types: Organization, Article/BlogPosting, FAQPage, Product, Service, BreadcrumbList.
- Een FAQ met `FAQPage`-markup is voor AI direct herkenbaar als vraag-antwoord → ideaal om te citeren.
- Test altijd met Google's **Rich Results Test**.

### 7. Content die werkt voor SEO én AEO
- Schrijf **vraaggericht** vanuit search intent.
- **Citeerbare content:** definitieve one-liners die los van de pagina begrijpelijk zijn. Vermijd hedge-woorden ("misschien", "zou kunnen"); gebruik "is", "vereist", "bestaat uit". Nuance in een vólgende zin, niet in dezelfde.
- Kernboodschap bovenaan elke sectie, lijsten, definitieblokken, conclusie per hoofdpunt.
- **FAQ's & kennisblokken** zijn goud: directe vraag → standalone antwoord (50–150 woorden), eerste zin = het antwoord. Ook buiten formele FAQ's: vraag-als-heading, definitieblokken, samenvattingsboxen.
- **Marketingtaal schaadt** AI-zichtbaarheid: vage promo-taal biedt niets om te citeren.

### 8. Van SEO naar AEO en GEO
- **AEO (Answer Engine Optimization):** geoptimaliseerd worden om geciteerd te worden door answer engines (AI Overviews, ChatGPT, Perplexity, voice assistants). Doel verschuift van *clicks* naar *citaties*.
- **GEO (Generative Engine Optimization):** zichtbaar zijn binnen door AI gegenereerde antwoorden.
- SEO en AEO zijn **en-en**, geen of-of: een sterke SEO-basis vergroot je AEO-kansen.
- **Hoe AI's bronnen kiezen:** retrieval → ranking → filtering → synthese → attributie. Betrouwbaarheidssignalen: domain authority, expertise/credentials, consistentie met andere bronnen, structuur, actualiteit, specificiteit.
- **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) telt ook voor AI-selectie.
- Overgeslagen worden: vage/generieke content, geen duidelijke auteur, technisch slecht bereikbaar, verouderd, pure commerciële bias.
- **Nieuwe succesindicatoren:** zichtbaarheid in antwoorden i.p.v. enkel rankings; zichtbaarheid kan ook zónder klik waarde hebben.

### 9. Search Console & Core Web Vitals
- Search Console = feedbackmechanisme: indexatiestatus, sitemaps, structured-data-errors, Core Web Vitals.
- **Core Web Vitals** (gemeten bij echte Chrome-gebruikers):
  - **LCP** (laadsnelheid grootste element) — doel **< 2,5s**
  - **INP** (reactiesnelheid op interactie, verving FID in 2024) — doel **< 200ms**
  - **CLS** (visuele stabiliteit) — doel **< 0,1**
- LCP verbeteren: SSR/prerender, hero-afbeelding optimaliseren, render-blocking JS/CSS vermijden, snelle hosting, kritieke resources preloaden.
- INP: lange JS-taken opbreken, zware berekeningen uit event handlers, in Svelte/React onnodige re-renders vermijden.
- CLS: afbeeldingen vaste width/height of aspect-ratio, fonts preloaden, ruimte reserveren voor dynamische content.

### 10. Principe achter automatisering & bijsturen (vendor-neutraal)
*(De Conductor-specifieke modules zijn eruit; dit is het generieke principe dat overblijft.)*
- SEO is **geen eenmalige actie maar een doorlopend proces**: meten → content-gaps vinden → bijwerken → opnieuw meten.
- Interpreteer zichtbaarheid, niet alleen kale rankings.
- Update bestaande content op basis van data; behandel je site als een levend systeem.

---

## Deel 2 — Bewezen aanvullingen (online geverifieerd)

Deze punten staan niet (of nauwelijks) in de koers, maar zijn aantoonbaar effectief en versterken precies de koerspunten over citeerbaarheid en AI-zichtbaarheid.

1. **Statistieken, citaten en quotes toevoegen verhoogt AI-citatie met ~30–41%.** Het Princeton/KDD-2024 GEO-onderzoek (getest op o.a. Perplexity, 10.000 queries, 25 domeinen) vond: +41% door quotes, +32% door statistieken, +30% door bronvermeldingen, +28% door taalkwaliteit. → Onderbouw elke claim met een cijfer of bron, voeg expertquotes toe, verwijs naar studies/data met duidelijke attributie. Dit is de concrete invulling van "citeerbare content".

2. **Cite zelf andere geloofwaardige bronnen.** Paradoxaal: door zelf naar autoriteit te verwijzen (onderzoek, overheidsdata, vakpublicaties) word je zelf vaker geciteerd. Het signaleert grondigheid.

3. **AI-crawlertoegang regelen in robots.txt.** Veel sites blokkeren (vaak per ongeluk, restant uit 2023–2024) AI-bots en verliezen zo citaties. Laat de **search/RAG-crawlers** expliciet toe: `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Perplexity-User`, `ClaudeBot`, `Claude-User`, `Google-Extended`, `Applebot-Extended`. Let op: een eerdere `User-agent: * / Disallow: /` overschrijft alles eronder. Zet de allow-regels bovenaan en verwijs naar je sitemap in robots.txt.

4. **Recency telt.** Content die binnen ~3 maanden is gepubliceerd/ge-update wordt aantoonbaar vaker geciteerd. Let op: alleen `dateModified` aanpassen werkt níet — er moet inhoudelijk iets toegevoegd zijn (verse cijfers, nieuwe bronnen).

5. **Answer-first + vraag-headings.** Formuleer H2/H3 als de échte vraag van de gebruiker ("Wat is X?") en zet het antwoord in de eerste zin eronder. Generative engines extraheren dit format als eerste.

6. **Entity-consistentie over het hele web.** AI beoordeelt autoriteit holistisch: consistente naam/adres/contact (NAP) en omschrijving over je site, social, reviews en vermeldingen versterken je citatiekans. Brand-mentions correleren met citaties via entity-herkenning.

7. **Canonical tags, hreflang, Open Graph, semantische HTML5** — standaard SEO-hygiëne die in de koers ontbreekt (zie checklist hieronder).

> **Niet opgenomen (nog niet bewezen):** `llms.txt` / `llms-full.txt` worden veel gehyped, maar in 2026 hebben de crawler-vendors hier geen werking aan toegekend. Geen aantoonbaar effect op AI-retrieval — dus laat staan, geen prioriteit.

---

## Deel 3 — De volledige "sowieso toevoegen"-checklist

Concreet en implementeerbaar. **(+)** = aanvulling buiten de koers (geverifieerd).

### A. Technisch fundament
- [ ] HTTPS actief, geen mixed content **(+)**
- [ ] Unieke `<title>` (50–60 tekens) per pagina — in de **initiële HTML**
- [ ] Unieke meta description (150–160 tekens) per pagina — in de initiële HTML
- [ ] Eén unieke H1 per pagina; logische H2/H3-hiërarchie
- [ ] Beschrijvende, korte URL's
- [ ] Mobielvriendelijk / responsive
- [ ] **Canonical tag** op elke pagina (voorkomt duplicate content) **(+)**
- [ ] `robots.txt` aanwezig, met **sitemap-verwijzing** en **AI-crawler allow-regels** (zie Deel 2 #3) **(+)**
- [ ] XML-sitemap aanwezig en ingediend in Search Console
- [ ] Correcte 404-afhandeling en 301-redirects voor verplaatste URL's **(+)**
- [ ] SPA-routes resolven server-side (geen 404/lege pagina op deeplinks)
- [ ] SEO-kritische content + meta tags in de initiële HTML (SSR/SSG/prerender) — niet alleen via JS
- [ ] `hreflang` als de site meertalig is **(+)**
- [ ] Open Graph + Twitter Card meta voor social sharing **(+)**
- [ ] Semantische HTML5 (`<article>`, `<nav>`, `<main>`, `<section>`) **(+)**

### B. Afbeeldingen & performance
- [ ] Alt-tekst op alle afbeeldingen (beschrijvend, niet keyword-stuffed)
- [ ] WebP + gecomprimeerd; beschrijvende bestandsnamen
- [ ] `width`/`height` of `aspect-ratio` gezet (voorkomt CLS)
- [ ] Lazy-load alleen buiten de viewport; hero direct laden
- [ ] LCP < 2,5s · INP < 200ms · CLS < 0,1
- [ ] Render-blocking JS/CSS minimaliseren; kritieke resources preloaden; snelle hosting

### C. Structured data (JSON-LD)
- [ ] `Organization` (met logo + `sameAs` naar socials)
- [ ] `Article` / `BlogPosting` (auteur, `datePublished`, `dateModified`)
- [ ] `FAQPage` op FAQ-secties
- [ ] `Product` en/of `Service` waar van toepassing
- [ ] `BreadcrumbList`
- [ ] `LocalBusiness` bij lokale dienstverlening (NAP, openingstijden) **(+)**
- [ ] Gevalideerd met Rich Results Test

### D. Content & semantiek
- [ ] Beantwoordt de search intent volledig
- [ ] Kernonderwerp in de eerste ~100–150 woorden
- [ ] Kernbegrippen gedefinieerd in aparte blokken
- [ ] Definitieve statements / citeerbare one-liners; geen hedge-woorden
- [ ] Korte alinea's + lijsten (scanbaar voor mens en AI)
- [ ] FAQ-secties: directe, standalone antwoorden (50–150 woorden, antwoord in zin 1)
- [ ] Vraag-vormige headings + answer-first structuur **(+)**
- [ ] Statistieken, cijfers en bron-/expertquotes met attributie **(+, +30–41% AI-citatie)**
- [ ] Eigen data / case studies met kwantificeerbare resultaten **(+)**
- [ ] Geen vage marketingtaal
- [ ] Duidelijke auteur + credentials (E-E-A-T)
- [ ] Sterke "Over ons"-pagina met expertise-bewijs
- [ ] Update-/publicatiedatum zichtbaar; content inhoudelijk vers houden **(+)**

### E. Architectuur & autoriteit
- [ ] 3–5 kernonderwerpen gekozen; breed én diep gedekt
- [ ] Hub-/landingspagina per kernthema + ondersteunende blogs + kennisbank
- [ ] Elke pagina linkt naar ≥3 relevante interne pagina's en wordt vanuit ≥3 gelinkt
- [ ] Beschrijvende anchor-teksten (geen "klik hier")
- [ ] Breadcrumbs aanwezig
- [ ] Gerelateerde-content-links onderaan pagina's

### F. AEO / AI-zichtbaarheid
- [ ] AI-search-crawlers toegelaten in robots.txt **(+)**
- [ ] Zelfstandige, extraheerbare content-blokken
- [ ] Consistente entity-info (NAP, omschrijving, socials) over het hele web **(+)**
- [ ] Test: stel ChatGPT én Perplexity een vraag in jouw vakgebied — word je geciteerd?

### G. Meten & bijsturen
- [ ] Google Search Console ingericht; sitemap ingediend
- [ ] Indexatie, Core Web Vitals en structured-data-errors monitoren
- [ ] AI-citaties tracken (serverlogs of een AI-visibility-tool) **(+)**
- [ ] SEO als doorlopend proces: meten → gaps vinden → updaten → opnieuw meten

---

## Bronnen (aanvullingen)
- Aggarwal et al., *GEO: Generative Engine Optimization*, Princeton/Georgia Tech/Allen AI/IIT Delhi — ACM KDD 2024 (arXiv:2311.09735). +30–41% AI-zichtbaarheid door statistieken/quotes/citaten.
- HubSpot AI Search Trends 2025 — recency: verse content ~3× vaker geciteerd.
- AI-crawler/robots.txt-referenties 2026 (o.a. Anagram, CapstonAI, Citevera, No Hacks) — search- vs. training-bots; llms.txt zonder bewezen effect.
