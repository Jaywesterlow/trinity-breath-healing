/**
 * Country dial codes for the contact form's phone field.
 *
 * The list is deliberately short: the Netherlands first, then the countries
 * whose numbers actually turn up in a Dutch practice's inbox. A 200-entry
 * picker is worse than a 13-entry one for everybody who is not in it — the
 * field still accepts any digits, only the prefix is chosen here.
 *
 * Flags are inline SVG rather than emoji on purpose: Windows ships no flag
 * glyphs, so 🇳🇱 renders as the letters "NL" there. Tricolours are exact;
 * GB, US, TR, MA and SR are simplified marks at 20x14 — recognisable at the
 * size they are drawn, not heraldically correct.
 */
export interface Country {
	/** ISO 3166-1 alpha-2, used as the stable key. */
	code: string;
	name: string;
	/** E.164 dial prefix including the plus. */
	dial: string;
	/** Inline SVG, viewBox 0 0 3 2. Trusted constant — never user input. */
	flag: string;
}

const bars = (colours: string[]) =>
	colours
		.map(
			(fill, i) =>
				`<rect width="3" height="${2 / colours.length}" y="${(i * 2) / colours.length}" fill="${fill}"/>`
		)
		.join('');

const stripes = (colours: string[]) =>
	colours
		.map(
			(fill, i) =>
				`<rect width="${3 / colours.length}" height="2" x="${(i * 3) / colours.length}" fill="${fill}"/>`
		)
		.join('');

const STAR =
	'M0 -.42 L.123 -.13 .42 -.13 .18 .05 .26 .34 0 .17 -.26 .34 -.18 .05 -.42 -.13 -.123 -.13 Z';

export const COUNTRIES: Country[] = [
	{ code: 'NL', name: 'Nederland', dial: '+31', flag: bars(['#AE1C28', '#FFFFFF', '#21468B']) },
	{ code: 'BE', name: 'België', dial: '+32', flag: stripes(['#000000', '#FAE042', '#ED2939']) },
	{ code: 'DE', name: 'Duitsland', dial: '+49', flag: bars(['#000000', '#DD0000', '#FFCE00']) },
	{ code: 'FR', name: 'Frankrijk', dial: '+33', flag: stripes(['#002395', '#FFFFFF', '#ED2939']) },
	{
		code: 'GB',
		name: 'Verenigd Koninkrijk',
		dial: '+44',
		flag: '<rect width="3" height="2" fill="#012169"/><path d="M0 .7h1.25V0h.5v.7H3v.6H1.75V2h-.5V1.3H0Z" fill="#FFFFFF"/><path d="M0 .85h1.4V0h.2v.85H3v.3H1.6V2h-.2V1.15H0Z" fill="#C8102E"/>'
	},
	{
		code: 'ES',
		name: 'Spanje',
		dial: '+34',
		flag: '<rect width="3" height="2" fill="#AA151B"/><rect width="3" height="1" y=".5" fill="#F1BF00"/>'
	},
	{ code: 'IT', name: 'Italië', dial: '+39', flag: stripes(['#009246', '#FFFFFF', '#CE2B37']) },
	{
		code: 'PT',
		name: 'Portugal',
		dial: '+351',
		flag: '<rect width="3" height="2" fill="#FF0000"/><rect width="1.2" height="2" fill="#006600"/><circle cx="1.2" cy="1" r=".38" fill="#FFD700"/>'
	},
	{ code: 'PL', name: 'Polen', dial: '+48', flag: bars(['#FFFFFF', '#DC143C']) },
	{
		code: 'TR',
		name: 'Turkije',
		dial: '+90',
		flag:
			'<rect width="3" height="2" fill="#E30A17"/><circle cx="1.15" cy="1" r=".42" fill="#FFFFFF"/><circle cx="1.3" cy="1" r=".34" fill="#E30A17"/><g transform="translate(1.85 1) scale(.55)" fill="#FFFFFF">' +
			`<path d="${STAR}"/>` +
			'</g>'
	},
	{
		code: 'MA',
		name: 'Marokko',
		dial: '+212',
		flag:
			'<rect width="3" height="2" fill="#C1272D"/><g transform="translate(1.5 1) scale(1.1)" fill="none" stroke="#006233" stroke-width=".12">' +
			`<path d="${STAR}"/>` +
			'</g>'
	},
	{
		code: 'SR',
		name: 'Suriname',
		dial: '+597',
		flag:
			'<rect width="3" height="2" fill="#377E3F"/><rect width="3" height="1.1" y=".45" fill="#FFFFFF"/><rect width="3" height=".7" y=".65" fill="#B40A2D"/><g transform="translate(1.5 1) scale(.95)" fill="#ECC81D">' +
			`<path d="${STAR}"/>` +
			'</g>'
	},
	{
		code: 'US',
		name: 'Verenigde Staten',
		dial: '+1',
		flag:
			'<rect width="3" height="2" fill="#FFFFFF"/>' +
			[0, 2, 4, 6]
				.map((i) => `<rect width="3" height=".2" y="${i * 0.286}" fill="#B22234"/>`)
				.join('') +
			'<rect width="1.3" height="1.14" fill="#3C3B6E"/>'
	}
];

export const DEFAULT_COUNTRY = COUNTRIES[0]!;

export function countryByDial(dial: string): Country | undefined {
	return COUNTRIES.find((c) => c.dial === dial);
}
