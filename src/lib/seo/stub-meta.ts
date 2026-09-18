/**
 * SEO stub metadata — single source of truth for all remaining stub routes.
 *
 * Each entry provides:
 *   title:       WITHOUT the brand. Head.svelte appends " | TRINITY Breath &
 *                Healing" and is the only place that decides the suffix, so a
 *                title that carries the name itself ships it twice. These four
 *                each used to, in three different spellings — "Trinity Healing
 *                BnH", "| Trinity", "TRINITY Breath & Healing NL". Aim for 25–35
 *                here, which lands the rendered title at 50–62.
 *   description: 148–162 chars (the audit gate's own bounds, decoded). Second
 *                person, "je" not "uw" — this is the sentence in the search
 *                result, and the site does not address anyone formally.
 *   crumbs:      BreadcrumbList input — starts [{name:'Home',path:'/'}],
 *                ends with {name:<page>,path:<routePath>}
 *
 * Uniqueness: no two entries share identical title or description (Pitfall #7 — distinct
 * per-route schema prevents duplicate-content devaluation by AI crawlers).
 *
 * Four entries left as of 2026-09-09. Eleven graduated to real content that day —
 * the seven modalities, /diensten, /behandelingen, /werkwijze and /contact — and
 * each now owns its title and description in its own +page.ts, next to the copy it
 * describes. /faq graduated earlier for the same reason.
 *
 * The four that remain are the ones with nothing truthful to put on them yet:
 * /over-mij is waiting on her own words, and /blog, /artikelen and /reviews have no
 * posts and no reviews. Writing filler for those would be the exact thin-content
 * problem the sitemap exclusion exists to avoid, so they stay stubs and stay out.
 */

export interface StubMeta {
	/** The <title> tag, without the brand suffix — Head.svelte adds that. */
	title: string;
	/**
	 * The on-page <h1>. Separate from `title` on purpose: the two are read in
	 * different places by different people, and using the title tag as a heading
	 * put "Blog – Inzichten over ademwerk en heling | Trinity" at the top of the
	 * page in 48px display type, pipe included.
	 */
	heading: string;
	/** The <meta name="description">. */
	description: string;
	/** The first line on the page. Plain, and not the meta description reused. */
	lead: string;
	crumbs: { name: string; path: string }[];
}

export const STUB_META: Record<string, StubMeta> = {
	// ─── /over-mij ──────────────────────────────────────────────────────────────
	'/over-mij': {
		title: 'Over mij – wie je tegenover je hebt',
		heading: 'Over mij',
		description:
			'De therapeut achter Trinity Breath & Healing begeleidt vanuit eigen ervaring bij ademwerk en lichaamsgerichte therapie en alle energetische behandelingen.',
		lead: 'Wie je tegenover je hebt, waar ik voor opgeleid ben en hoe ik werk.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Over mij', path: '/over-mij' }
		]
	},

	// ─── /blog ──────────────────────────────────────────────────────────────────
	'/blog': {
		title: 'Blog over ademwerk en herstel',
		heading: 'Blog',
		description:
			'Lees artikelen van Trinity Breath & Healing over ademwerk, traumaverwerking en energetische therapie voor je lichamelijk en geestelijk welzijn en herstel.',
		lead: 'Stukken over ademwerk, spanning en herstel. Er staat nog niets: als er iets is, komt het hier.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Blog', path: '/blog' }
		]
	},

	// ─── /artikelen ─────────────────────────────────────────────────────────────
	'/artikelen': {
		title: 'Artikelen en kennisbank',
		heading: 'Artikelen',
		description:
			'Verdiep je kennis met artikelen van Trinity Breath & Healing over ademtherapie, lichaamsgerichte methoden en energetisch werken als weg naar je herstel.',
		lead: 'Langere stukken over de methodes waar ik mee werk. Nog in de maak.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Artikelen', path: '/artikelen' }
		]
	},

	// /privacyverklaring, /algemene-voorwaarden and /disclaimer used to live here.
	// They now carry real content and own their own metadata — see each route's
	// +page.ts.

	'/reviews': {
		title: 'Reviews en ervaringen van cliënten',
		heading: 'Reviews',
		description:
			'Ervaringen van mensen die bij Trinity Breath & Healing in Amsterdam een sessie volgden. Lees wat ademwerk en energetische behandeling voor hen betekende.',
		lead: 'Ervaringen van mensen die een sessie volgden. Ik verzamel ze nog, dus deze pagina is voorlopig leeg.',
		crumbs: [
			{ name: 'Home', path: '/' },
			{ name: 'Reviews', path: '/reviews' }
		]
	}
};
