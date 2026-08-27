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
import { isEmailConfigured, sendBookingEmail, sendBookingReceived } from '$lib/server/email';
import { CANCELLATION_HOURS } from '$lib/legal/meta';
import { isDatabaseConfigured } from '$lib/server/db';
import { PENDING_TTL_HOURS, reserveSlot } from '$lib/server/bookings';
import { hashToken, signToken, type BookingToken } from '$lib/server/token';
import { SITE_URL } from '$lib/seo/defaults';
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
	/* "Aanvraag", not "afspraak": the slot is held, not booked, until she
	   answers. Promising a confirmation that may turn into a decline is how a
	   visitor ends up feeling misled. */
	success:
		'Je aanvraag is verstuurd. Je hoort binnen 48 uur of het moment doorgaat — je krijgt daar bericht van per e-mail.'
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

export const POST: RequestHandler = async ({ request, getClientAddress, fetch }) => {
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

	if (!isEmailConfigured() || !isDatabaseConfigured()) return fail(503, MESSAGES.unconfigured);

	/* Hold the slot before sending anything. If the insert loses the race the
	   visitor is told the moment has gone, which is true — sending the mail
	   first would confirm a slot that someone else already holds. */
	const expiresAt = Math.floor(Date.now() / 1000) + PENDING_TTL_HOURS * 60 * 60;
	const claim: BookingToken = {
		voornaam: parsed.data.voornaam,
		achternaam: parsed.data.achternaam,
		email: parsed.data.email,
		klachten: parsed.data.klachten,
		datum: parsed.data.datum,
		start: slot.start,
		end: slot.end,
		exp: expiresAt
	};

	const token = signToken(claim);
	const reserved = await reserveSlot(
		{ datum: claim.datum, start: claim.start, end: claim.end },
		hashToken(token)
	);
	if (!reserved.ok) {
		if (reserved.reason === 'taken') return fail(409, MESSAGES.unavailable);
		console.error('[booking] reserve failed:', reserved.detail);
		return fail(502, MESSAGES.upstream);
	}

	const spoken = spokenDate(parsed.data.datum);
	const decideUrl = `${SITE_URL}/afspraak/${encodeURIComponent(token)}`;
	const result = await sendBookingEmail(parsed.data, spoken, decideUrl);
	if (!result.ok) {
		if (result.reason === 'upstream') console.error('[booking] resend failed:', result.detail);
		return fail(502, MESSAGES.upstream);
	}

	/* Acknowledge to the visitor too. Deliberately not awaited as a condition of
	   success: the slot is held and she has been notified, so failing the whole
	   request because the courtesy copy bounced would throw away a real booking
	   over a cosmetic step. Logged instead. */
	const ack = await sendBookingReceived(
		{
			to: parsed.data.email,
			clientName: parsed.data.voornaam,
			spokenDate: spoken,
			start: slot.start,
			end: slot.end,
			cancellationHours: CANCELLATION_HOURS
		},
		fetch
	);
	if (!ack.ok) console.error('[booking] acknowledgement failed:', ack);

	return json({ ok: true, message: MESSAGES.success });
};
