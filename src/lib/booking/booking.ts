/**
 * Booking request contract — shared by the planner's last step and
 * /api/booking, so a Dutch message can only be wrong in one place.
 *
 * The slot itself travels with the request (date + start + end) because the
 * server re-derives it from the schedule before it will send anything: a
 * client can post any time it likes, and only the schedule decides what is
 * really bookable.
 */
import { z } from 'zod';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookingSchema = z.object({
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
	/** Optional — someone may just want to talk, without naming it up front. */
	klachten: z.string().trim().max(2000, 'Dit is te lang (maximaal 2000 tekens).').default(''),
	/** "YYYY-MM-DD" of the chosen day. */
	datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Kies een geldige datum.'),
	start: z.string().regex(TIME, 'Kies een geldige tijd.'),
	end: z.string().regex(TIME, 'Kies een geldige tijd.'),
	/** Honeypot, same trick as the contact form — parsed, never rejected here. */
	website: z.string().max(200).optional().default('')
});

export type BookingInput = z.input<typeof bookingSchema>;
export type BookingValues = z.output<typeof bookingSchema>;

export const emptyBooking = {
	voornaam: '',
	achternaam: '',
	email: '',
	klachten: '',
	website: ''
};

/** Only the fields the visitor types can carry an error message. */
export type BookingFieldName = 'voornaam' | 'achternaam' | 'email' | 'klachten';
export type BookingFieldErrors = Partial<Record<BookingFieldName, string>>;

const TYPED_FIELDS: BookingFieldName[] = ['voornaam', 'achternaam', 'email', 'klachten'];

/** Flatten a zod failure into `{ field: firstMessage }` for direct render. */
export function toBookingErrors(error: z.ZodError): BookingFieldErrors {
	const out: BookingFieldErrors = {};
	for (const issue of error.issues) {
		const key = issue.path[0] as BookingFieldName | undefined;
		if (key && TYPED_FIELDS.includes(key) && !out[key]) out[key] = issue.message;
	}
	return out;
}

export function isBookingHoneypotTripped(values: BookingValues): boolean {
	return values.website.trim().length > 0;
}
