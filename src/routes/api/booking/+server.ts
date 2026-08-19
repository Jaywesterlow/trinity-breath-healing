/**
 * POST /api/booking — a requested slot from the planner's last step.
 *
 * Like /api/contact this is one of the few routes that opts out of
 * prerendering. It does two things the client cannot be trusted to do: it
 * re-validates the visitor's details, and it re-derives the slot from the
 * schedule. A posted time that the schedule does not actually offer is
 * rejected, however convincing the payload looks.
 */
import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	bookingSchema,
	isBookingHoneypotTripped,
	toBookingErrors,
	type BookingFieldErrors
} from '$lib/booking/booking';
import { DEFAULT_SCHEDULE, fromIso, isoWeekday, slotsFor } from '$lib/booking/schedule';
import { isEmailConfigured, sendBookingEmail } from '$lib/server/email';
import { BRAND } from '$lib/constants/brand';

export const prerender = false;

const WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function maxPerWindow(): number {
	const configured = Number(env.CONTACT_RATE_LIMIT_MAX);
	return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MAX_PER_WINDOW;
}

function rateLimited(ip: string): boolean {
	const now = Date.now();
	const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
	recent.push(now);
	hits.set(ip, recent);
	return recent.length > maxPerWindow();
}

const MESSAGES = {
	invalid: 'Controleer de gemarkeerde velden en probeer het opnieuw.',
	unavailable: 'Dit moment is niet meer beschikbaar. Kies een ander tijdstip.',
	rateLimited:
		'Er zijn net te veel aanvragen verstuurd. Probeer het over een paar minuten opnieuw.',
	unconfigured: `Online plannen is nog niet actief. Mail gerust rechtstreeks naar ${BRAND.email}.`,
	upstream: `De aanvraag kon niet worden verstuurd. Mail gerust rechtstreeks naar ${BRAND.email}.`,
	success: 'Je aanvraag is verstuurd. Je krijgt zo snel mogelijk een bevestiging per e-mail.'
} as const;

const MONTHS = [
	'januari',
	'februari',
	'maart',
	'april',
	'mei',
	'juni',
	'juli',
	'augustus',
	'september',
	'oktober',
	'november',
	'december'
];
const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

function spokenDate(iso: string): string {
	const date = fromIso(iso);
	return `${DAYS[isoWeekday(date) - 1]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function fail(status: number, message: string, errors?: BookingFieldErrors): Response {
	return json({ ok: false, message, errors: errors ?? {} }, { status });
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	if (rateLimited(getClientAddress())) return fail(429, MESSAGES.rateLimited);

	const raw = (await request.json().catch(() => ({}))) as Record<string, unknown>;
	const parsed = bookingSchema.safeParse(raw);

	if (!parsed.success) return fail(400, MESSAGES.invalid, toBookingErrors(parsed.error));

	// Honeypot tripped — answer as if booked, tell the bot nothing.
	if (isBookingHoneypotTripped(parsed.data)) {
		return json({ ok: true, message: MESSAGES.success });
	}

	// The schedule, not the payload, decides what exists.
	const offered = slotsFor(DEFAULT_SCHEDULE, parsed.data.datum);
	const slot = offered.find((s) => s.start === parsed.data.start && s.end === parsed.data.end);
	if (!slot) return fail(409, MESSAGES.unavailable);

	if (!isEmailConfigured()) return fail(503, MESSAGES.unconfigured);

	const result = await sendBookingEmail(parsed.data, spokenDate(parsed.data.datum));
	if (!result.ok) {
		if (result.reason === 'upstream') console.error('[booking] resend failed:', result.detail);
		return fail(502, MESSAGES.upstream);
	}

	return json({ ok: true, message: MESSAGES.success });
};
