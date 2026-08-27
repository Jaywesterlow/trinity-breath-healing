/**
 * The decision page: where the practitioner approves or declines.
 *
 * A page rather than two links straight from the e-mail, and that is the whole
 * design. Gmail, Outlook and most corporate mail gateways fetch the links in a
 * message to scan them for malware. A link that acts on being visited would be
 * approved by a scanner before she had even opened the mail. So `load` only
 * reads, and the decision happens on a POST from a form she can see.
 */
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { verifyToken, hashToken } from '$lib/server/token';
import { decide, statusOf } from '$lib/server/bookings';
import { isDatabaseConfigured } from '$lib/server/db';
import { sendBookingApproved, sendBookingRejected, isEmailConfigured } from '$lib/server/email';
import { buildInvite } from '$lib/server/ics';
import { SITE_URL } from '$lib/seo/defaults';
import { BRAND } from '$lib/constants/brand';
import { CANCELLATION_HOURS } from '$lib/legal/meta';
import { env } from '$env/dynamic/private';

export const prerender = false;
/* Never indexed, never cached: it is addressed to one person and carries a
   name and an e-mail in the page body. */
export const ssr = true;

const DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
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

function spokenDate(iso: string): string {
	const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
	const date = new Date(year, month - 1, day);
	return `${DAYS[date.getDay()]} ${day} ${MONTHS[month - 1]} ${year}`;
}

export const load: PageServerLoad = async ({ params }) => {
	const token = verifyToken(params.token);
	/* One message for a bad signature, a malformed token and an expired one.
	   Distinguishing them would tell someone probing the URL which part of
	   their guess was wrong. */
	if (!token) error(404, 'Deze link is niet meer geldig.');

	const status = isDatabaseConfigured() ? await statusOf(hashToken(params.token)) : null;

	return {
		naam: `${token.voornaam} ${token.achternaam}`,
		email: token.email,
		klachten: token.klachten,
		datum: token.datum,
		spoken: spokenDate(token.datum),
		start: token.start,
		end: token.end,
		status: status ?? 'unknown'
	};
};

export const actions: Actions = {
	default: async ({ request, params, fetch }) => {
		const token = verifyToken(params.token);
		if (!token) return fail(410, { message: 'Deze link is niet meer geldig.' });
		if (!isDatabaseConfigured()) return fail(503, { message: 'De agenda is niet bereikbaar.' });

		const form = await request.formData();
		const choice = form.get('decision');
		if (choice !== 'approved' && choice !== 'rejected') {
			return fail(400, { message: 'Onbekende keuze.' });
		}

		const result = await decide(hashToken(params.token), choice);
		if (!result.ok) {
			return fail(410, {
				message:
					result.reason === 'expired'
						? 'Deze aanvraag is verlopen. Het tijdslot is weer vrijgegeven.'
						: 'Deze aanvraag bestaat niet meer.'
			});
		}
		/* Already answered — a second click, or a prefetch that got through.
		   Report the standing answer instead of mailing the visitor twice. */
		if (!result.changed) {
			return {
				done: true,
				decision: result.status,
				repeat: true,
				message:
					result.status === 'approved'
						? 'Deze aanvraag was al goedgekeurd.'
						: 'Deze aanvraag was al afgewezen.'
			};
		}

		if (!isEmailConfigured()) {
			return {
				done: true,
				decision: choice,
				repeat: false,
				message: 'Opgeslagen, maar er kon geen e-mail worden verstuurd.'
			};
		}

		const spoken = spokenDate(token.datum);
		const organiser = env.CONTACT_TO_EMAIL || BRAND.email;

		const sent =
			choice === 'approved'
				? await sendBookingApproved(
						{
							to: token.email,
							clientName: token.voornaam,
							spokenDate: spoken,
							start: token.start,
							end: token.end,
							cancellationHours: CANCELLATION_HOURS,
							ics: buildInvite({
								/* Stable per request, so a later update or cancellation
								   can address the same event rather than creating a
								   duplicate in her calendar. */
								uid: `${hashToken(params.token).slice(0, 32)}@trinitybreathhealing.nl`,
								datum: token.datum,
								start: token.start,
								end: token.end,
								clientName: `${token.voornaam} ${token.achternaam}`,
								clientEmail: token.email,
								organiserEmail: organiser
							})
						},
						fetch
					)
				: await sendBookingRejected(
						{
							to: token.email,
							clientName: token.voornaam,
							spokenDate: spoken,
							start: token.start,
							bookingUrl: `${SITE_URL}/#contact`
						},
						fetch
					);

		if (!sent.ok) console.error('[afspraak] mail failed:', sent);

		return {
			done: true,
			decision: choice,
			repeat: false,
			message: sent.ok
				? choice === 'approved'
					? 'Goedgekeurd. De bevestiging en de agenda-uitnodiging zijn verstuurd.'
					: 'Afgewezen. Het tijdslot staat weer open en er is bericht gestuurd.'
				: 'De keuze is opgeslagen, maar de e-mail kon niet worden verstuurd.'
		};
	}
};
