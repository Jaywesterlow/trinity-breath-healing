/**
 * Her price list (WhatsApp 2026-10-31, 20:24; the amounts match her form of the
 * same day; TRB to €99 on 2026-11-08, 11:44). Read by /tarieven and by the
 * Service JSON-LD, so a price changes in one place.
 *
 * Names come from BRAND.services through the slug, not from her list, so a
 * treatment is called the same on every page. Her list says "Rasterhealing"
 * where the site says "Rasterenergie" (her answer of 2-11). BRTT is Body
 * Remembers Trauma Therapy (8-11), as her list already said.
 */
export interface PriceRow {
	/** The service page this row belongs to. */
	slug: string;
	/** Only for rows that are not a treatment's own name. */
	label?: string;
	duration: string;
	price: number;
}

export interface PriceGroup {
	id: string;
	title: string;
	rows: readonly PriceRow[];
	note?: string;
}

const CLEARING = 'clearing-ascensie';

export const PRICE_GROUPS: readonly PriceGroup[] = [
	{
		id: 'energetisch',
		title: 'Energetische behandelingen',
		rows: [
			{ slug: 'mahatma-healing', duration: '30 minuten', price: 45 },
			{ slug: 'goldhealing', duration: '30 minuten', price: 45 },
			{ slug: 'raster-energie', duration: '30 minuten', price: 45 }
		],
		note: 'Deze drie behandelingen kunnen zowel in de praktijkruimte als op afstand worden aangeboden. Hiervoor gelden dezelfde tarieven.'
	},
	{
		id: 'lichaam',
		title: 'Lichaamsgerichte behandelingen en ademwerk',
		rows: [
			{ slug: 'cranio-fascia-unwinding', duration: '60 minuten', price: 75 },
			{ slug: 'spinal-touch', duration: '60 minuten', price: 85 },
			{ slug: 'brtt-body', duration: '60–90 minuten', price: 75 },
			{ slug: 'trb-breathwork', duration: '60–90 minuten', price: 99 }
		]
	},
	{
		id: 'clearing',
		title: 'Clearing & Ascensie-activaties',
		rows: [
			{ slug: CLEARING, label: 'Clearing', duration: '60 minuten', price: 85 },
			{ slug: CLEARING, label: 'Eerste activatie', duration: '60 minuten', price: 85 },
			{ slug: CLEARING, label: 'Tweede activatie', duration: '60 minuten', price: 85 },
			{ slug: CLEARING, label: 'Compleet traject', duration: '3 uur', price: 225 }
		]
	}
];

export const pricesFor = (slug: string): PriceRow[] =>
	PRICE_GROUPS.flatMap((group) => group.rows).filter((row) => row.slug === slug);
