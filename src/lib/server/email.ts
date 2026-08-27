/**
 * Resend transport for the forms that mail the practitioner.
 *
 * Talks to the Resend REST API over `fetch` rather than the SDK: one less
 * dependency in the serverless bundle, and the payload we send is four fields.
 * EU data residency (CLAUDE.md: `eu-west-1`) is an account/domain-level setting
 * in Resend — configure the sending domain in the EU region; there is no
 * per-request region field to set here.
 *
 * Env (all read lazily via $env/dynamic/private so an unset key never breaks the
 * prerender build — the endpoint degrades to a friendly "mail me directly" instead):
 *   RESEND_API_KEY      — server-only API key
 *   CONTACT_TO_EMAIL    — inbox that receives submissions (defaults to BRAND.email)
 *   CONTACT_FROM_EMAIL  — verified sender on the Resend domain
 *
 * Both the contact form and the booking flow deliver through `deliver()`; only
 * the body-building differs, so a change to how mail is sent lands in one place.
 */
import { env } from '$env/dynamic/private';
import { BRAND } from '$lib/constants/brand';
import type { ContactValues } from '$lib/forms/contact';
import type { BookingValues } from '$lib/booking/booking';

export type SendResult =
	| { ok: true; id: string | null }
	| { ok: false; reason: 'unconfigured' | 'upstream'; detail?: string };

/** True when the transport has everything it needs to actually deliver mail. */
export function isEmailConfigured(): boolean {
	return Boolean(env.RESEND_API_KEY && env.CONTACT_FROM_EMAIL);
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function buildBodies(values: ContactValues) {
	const naam = `${values.voornaam} ${values.achternaam}`;
	const telefoon = values.telefoon ? `${values.landcode} ${values.telefoon}` : '—';

	const text = [
		`Naam: ${naam}`,
		`E-mail: ${values.email}`,
		`Telefoon: ${telefoon}`,
		'',
		'Bericht:',
		values.bericht
	].join('\n');

	const html = [
		'<h2>Nieuw bericht via het contactformulier</h2>',
		`<p><strong>Naam:</strong> ${escapeHtml(naam)}<br>`,
		`<strong>E-mail:</strong> <a href="mailto:${encodeURIComponent(values.email)}">${escapeHtml(values.email)}</a><br>`,
		`<strong>Telefoon:</strong> ${escapeHtml(telefoon)}</p>`,
		`<p><strong>Bericht:</strong><br>${escapeHtml(values.bericht).replace(/\n/g, '<br>')}</p>`
	].join('');

	return { text, html, naam };
}

interface Attachment {
	filename: string;
	/** Raw UTF-8 content; encoded to base64 for Resend at send time. */
	content: string;
	/** e.g. 'text/calendar; method=REQUEST; charset=utf-8'. */
	contentType?: string;
}

interface Delivery {
	subject: string;
	text: string;
	html: string;
	/** Replying to the notification should reach the visitor, not the site. */
	replyTo: string;
	/** Defaults to the practitioner's inbox; set when writing to the visitor. */
	to?: string;
	attachments?: Attachment[];
}

async function deliver(mail: Delivery, fetchImpl: typeof fetch): Promise<SendResult> {
	if (!isEmailConfigured()) return { ok: false, reason: 'unconfigured' };

	const response = await fetchImpl('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.CONTACT_FROM_EMAIL,
			to: [mail.to || env.CONTACT_TO_EMAIL || BRAND.email],
			reply_to: mail.replyTo,
			subject: mail.subject,
			text: mail.text,
			html: mail.html,
			...(mail.attachments?.length
				? {
						attachments: mail.attachments.map((file) => ({
							filename: file.filename,
							/* Resend takes attachment content base64-encoded. */
							content: Buffer.from(file.content, 'utf8').toString('base64'),
							...(file.contentType ? { content_type: file.contentType } : {})
						}))
					}
				: {})
		})
	});

	if (!response.ok) {
		const detail = await response.text().catch(() => '');
		return { ok: false, reason: 'upstream', detail: `${response.status} ${detail}`.trim() };
	}

	const payload = (await response.json().catch(() => null)) as { id?: string } | null;
	return { ok: true, id: payload?.id ?? null };
}

export async function sendContactEmail(
	values: ContactValues,
	fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
	const { text, html, naam } = buildBodies(values);
	return deliver(
		{ subject: `Contactformulier — ${naam}`, text, html, replyTo: values.email },
		fetchImpl
	);
}

/**
 * A booking request. The practitioner reads this and confirms — the subject
 * line carries the slot so her inbox is sortable without opening anything.
 */
export async function sendBookingEmail(
	values: BookingValues,
	/** Human-readable date, e.g. "donderdag 20 augustus 2026". */
	spokenDate: string,
	/** Absolute URL of the decision page. Omitted only when unconfigured. */
	decideUrl: string | null,
	fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
	const naam = `${values.voornaam} ${values.achternaam}`;
	const klachten = values.klachten.trim() || '—';

	const text = [
		`Datum: ${spokenDate}`,
		`Tijd: ${values.start} - ${values.end}`,
		'',
		`Naam: ${naam}`,
		`E-mail: ${values.email}`,
		'',
		'Waar loopt deze persoon tegenaan:',
		klachten,
		...(decideUrl ? ['', 'Goedkeuren of afwijzen:', decideUrl] : [])
	].join('\n');

	const html = [
		'<h2>Nieuwe aanvraag voor een online meeting</h2>',
		`<p><strong>${escapeHtml(spokenDate)}</strong><br>`,
		`<strong>${escapeHtml(values.start)} - ${escapeHtml(values.end)}</strong> (30 minuten)</p>`,
		`<p><strong>Naam:</strong> ${escapeHtml(naam)}<br>`,
		`<strong>E-mail:</strong> <a href="mailto:${encodeURIComponent(values.email)}">${escapeHtml(values.email)}</a></p>`,
		`<p><strong>Waar loopt deze persoon tegenaan:</strong><br>${escapeHtml(klachten).replace(/\n/g, '<br>')}</p>`,
		/* One link to a page with two buttons, rather than an approve link and
		   a reject link here. Gmail and Outlook fetch links in e-mail to scan
		   them, so a link that acts on being visited would be triggered by a
		   scanner before she ever read the message. The decision has to happen
		   on a POST from a page she is looking at. */
		...(decideUrl
			? [
					`<p style="margin-top:24px"><a href="${decideUrl}" style="display:inline-block;padding:12px 20px;background:#3d4a35;color:#faf0e6;text-decoration:none;border-radius:999px">Aanvraag beoordelen</a></p>`,
					`<p style="font-size:13px;color:#5f6d56">Deze aanvraag houdt het tijdslot bezet tot je hem beantwoordt, en vervalt vanzelf na 48 uur.</p>`
				]
			: []),
		`<p style="font-size:13px;color:#5f6d56">Het tijdslot is op de website al geblokkeerd zodat niemand anders het kan aanvragen.</p>`
	].join('');

	return deliver(
		{
			subject: `Afspraakaanvraag — ${spokenDate}, ${values.start} — ${naam}`,
			text,
			html,
			replyTo: values.email
		},
		fetchImpl
	);
}

/**
 * Confirmation to the visitor once the practitioner approves, carrying the
 * calendar invitation as an attachment.
 *
 * Sent from the practice's address with `replyTo` pointing at her inbox — the
 * reverse of the notification above, because here the visitor is the one who
 * might want to reply.
 */
export async function sendBookingApproved(
	args: {
		to: string;
		clientName: string;
		spokenDate: string;
		start: string;
		end: string;
		ics: string;
	},
	fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
	const text = [
		`Hoi ${args.clientName},`,
		'',
		`Je afspraak is bevestigd: ${args.spokenDate}, ${args.start} - ${args.end}.`,
		'',
		'In de bijlage zit een agenda-uitnodiging die je aan je eigen agenda kunt toevoegen.',
		'',
		'Kun je onverhoopt niet? Laat het even weten door op deze mail te antwoorden.',
		'',
		'Tot dan!'
	].join('\n');

	const html = [
		`<p>Hoi ${escapeHtml(args.clientName)},</p>`,
		`<p>Je afspraak is bevestigd:<br><strong>${escapeHtml(args.spokenDate)}</strong><br><strong>${escapeHtml(args.start)} - ${escapeHtml(args.end)}</strong> (30 minuten)</p>`,
		'<p>In de bijlage zit een agenda-uitnodiging die je aan je eigen agenda kunt toevoegen.</p>',
		'<p>Kun je onverhoopt niet? Laat het even weten door op deze mail te antwoorden.</p>',
		'<p>Tot dan!</p>'
	].join('');

	return deliver(
		{
			to: args.to,
			subject: `Afspraak bevestigd — ${args.spokenDate}, ${args.start}`,
			text,
			html,
			replyTo: env.CONTACT_TO_EMAIL || BRAND.email,
			attachments: [
				{
					filename: 'afspraak.ics',
					content: args.ics,
					/* METHOD=REQUEST in the content type is what makes Gmail render
					   the attachment as an invitation with RSVP buttons rather than
					   an anonymous file. */
					contentType: 'text/calendar; method=REQUEST; charset=utf-8'
				}
			]
		},
		fetchImpl
	);
}

/**
 * The decline.
 *
 * Deliberately gives no reason and does not apologise at length: the honest
 * position is that the time does not work, and a wall of explanation would
 * read as a brush-off. It points straight back at the planner so the visitor
 * can pick another moment while they are still interested.
 */
export async function sendBookingRejected(
	args: { to: string; clientName: string; spokenDate: string; start: string; bookingUrl: string },
	fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
	const text = [
		`Hoi ${args.clientName},`,
		'',
		`Helaas lukt het niet op ${args.spokenDate} om ${args.start}.`,
		'',
		'Het tijdslot is weer vrijgegeven en er staan andere momenten open:',
		args.bookingUrl,
		'',
		'Kies gerust een ander moment — of antwoord op deze mail als je liever even overlegt.'
	].join('\n');

	const html = [
		`<p>Hoi ${escapeHtml(args.clientName)},</p>`,
		`<p>Helaas lukt het niet op <strong>${escapeHtml(args.spokenDate)}</strong> om <strong>${escapeHtml(args.start)}</strong>.</p>`,
		`<p>Er staan andere momenten open. <a href="${args.bookingUrl}">Kies een ander moment</a>.</p>`,
		'<p>Liever even overleggen? Antwoord gerust op deze mail.</p>'
	].join('');

	return deliver(
		{
			to: args.to,
			subject: `Over je aanvraag voor ${args.spokenDate}`,
			text,
			html,
			replyTo: env.CONTACT_TO_EMAIL || BRAND.email
		},
		fetchImpl
	);
}
