/**
 * The social row, in one place.
 *
 * Hero and Footer both render this set and used to build it twice, from two
 * near-identical literal arrays — which is how they both ended up linking
 * x.com/trinitybnh and facebook.com/trinitybnh, two accounts that never
 * existed. One list, derived from BRAND, means a channel can only be wrong
 * in one place.
 *
 * Decided 2026-08-24: Instagram, WhatsApp, e-mail. Instagram is the only real
 * social profile, and a single orphaned icon reads as an oversight rather than
 * a choice — so the row is filled out with the two channels she actually
 * answers on. All three are real; none is a placeholder.
 */
import { BRAND } from './brand';

export type SocialIconKey = 'instagram' | 'whatsapp' | 'mail';

export type SocialLink = {
	icon: SocialIconKey;
	href: string;
	label: string;
	/** Short visible wording, for the places that show the channel next to its
	    icon rather than relying on the icon alone. Kept clear of the contact
	    form's own field names, same as `label`. */
	text: string;
	/** mailto: opens the visitor's mail client — never a new tab. */
	newTab: boolean;
};

const isPending = (value: string) => value.startsWith('TODO_');

/** wa.me wants bare digits with the country code and no leading + or spaces. */
const whatsappDigits = BRAND.phone.replace(/\D/g, '');

/* Labels are kept short and free of the contact form's own field names.
   "Stuur een WhatsApp-bericht naar …" contained "Bericht", which is the
   label of the message textarea further down the page — and an accessible
   name is matched by substring, so the two collided. */

export const SOCIAL_LINKS: SocialLink[] = [
	{
		icon: 'instagram',
		href: `https://www.instagram.com/${BRAND.socials.instagram.replace('@', '')}/`,
		label: 'Trinity Breath & Healing op Instagram',
		text: BRAND.socials.instagram,
		newTab: true
	},
	...(isPending(BRAND.phone)
		? []
		: [
				{
					icon: 'whatsapp' as const,
					href: `https://wa.me/${whatsappDigits}`,
					label: `WhatsApp naar ${BRAND.phoneDisplay}`,
					text: 'WhatsApp',
					newTab: true
				}
			]),
	...(isPending(BRAND.email)
		? []
		: [
				{
					icon: 'mail' as const,
					href: `mailto:${BRAND.email}`,
					label: `E-mail naar ${BRAND.email}`,
					text: BRAND.email,
					newTab: false
				}
			])
];
