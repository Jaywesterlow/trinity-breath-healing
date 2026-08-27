/**
 * Contact form contract — shared by the client (ContactForm.svelte) and the
 * server (/api/contact). One schema, one set of Dutch messages: the browser
 * shows them inline before submit, the endpoint re-validates them because a
 * client-side check is a convenience, never a guarantee.
 */
import { z } from 'zod';

/**
 * Digits as typed after the dial code. Deliberately loose on length: the
 * prefix is now a country picker, and national number lengths vary from 7 to
 * 14 digits across the list.
 */
const PHONE_RE = /^[0-9][0-9\s]{5,15}$/;

export const contactSchema = z.object({
	voornaam: z.string().trim().min(2, 'Vul je voornaam in.').max(80, 'Deze voornaam is te lang.'),
	achternaam: z
		.string()
		.trim()
		.min(2, 'Vul je achternaam in.')
		.max(80, 'Deze achternaam is te lang.'),
	email: z
		.string()
		.trim()
		.min(1, 'Vul je e-mailadres in.')
		.max(254, 'Dit e-mailadres is te lang.')
		.email('Dit lijkt geen geldig e-mailadres.'),
	/** E.164 dial prefix chosen in the picker, e.g. "+31". */
	landcode: z
		.string()
		.trim()
		.regex(/^\+\d{1,4}$/, 'Kies een geldige landcode.')
		.default('+31'),
	/** Optional — Figma marks only naam/email/bericht as load-bearing. */
	telefoon: z
		.string()
		.trim()
		.max(24, 'Dit telefoonnummer is te lang.')
		.refine(
			(v) => v === '' || PHONE_RE.test(v),
			'Vul een geldig telefoonnummer in, bijv. 6 123 456 78.'
		),
	bericht: z
		.string()
		.trim()
		.min(10, 'Schrijf een bericht van minimaal 10 tekens.')
		.max(4000, 'Dit bericht is te lang (maximaal 4000 tekens).'),
	/**
	 * Honeypot. Hidden from people, irresistible to naive bots.
	 *
	 * Deliberately NOT rejected here: a 400 saying "this field must be empty"
	 * tells a bot exactly which field to leave alone next time. The schema just
	 * carries the value through; the endpoint checks it with isHoneypotTripped()
	 * and answers with a plain success instead.
	 */
	website: z.string().max(200).optional().default('')
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;

/** Blank starting values — also what the form resets to after a successful send. */
export const emptyContact: ContactInput = {
	voornaam: '',
	achternaam: '',
	email: '',
	landcode: '+31',
	telefoon: '',
	bericht: '',
	website: ''
};

/** True when the hidden field came back filled — i.e. not a person. */
export function isHoneypotTripped(values: ContactValues): boolean {
	return values.website.trim().length > 0;
}

export type FieldName = Exclude<keyof ContactValues, 'website' | 'landcode'>;
export type FieldErrors = Partial<Record<FieldName, string>>;

/** Flatten a zod failure into `{ field: firstMessage }` for direct render. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
	const out: FieldErrors = {};
	for (const issue of error.issues) {
		const key = issue.path[0] as FieldName | undefined;
		if (key && key !== ('website' as FieldName) && !out[key]) out[key] = issue.message;
	}
	return out;
}
