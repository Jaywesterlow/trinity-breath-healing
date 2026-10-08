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
	/** What the cursor says while it is over this icon. Shorter and more direct
	    than `label`, which has to work as a standalone accessible name; this one
	    is read in context, with the icon right under it. */
	tooltip: string;
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
		tooltip: 'Stuur een DM',
		newTab: true
	},
	...(isPending(BRAND.phone)
		? []
		: [
				{
					icon: 'whatsapp' as const,
					href: `https://wa.me/${whatsappDigits}`,
					label: `WhatsApp naar ${BRAND.phoneDisplay}`,
					tooltip: 'Stuur een WhatsApp',
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
					tooltip: 'Stuur een e-mail',
					newTab: false
				}
			])
];
