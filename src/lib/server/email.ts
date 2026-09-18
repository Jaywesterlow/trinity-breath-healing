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
import { SITE_URL } from '$lib/seo/defaults';

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

/**
 * One HTML shell for every message the site sends.
 *
 * Written as inline-styled tables rather than modern CSS because Outlook still
 * renders mail through Word's engine: no flexbox, no grid, and `<div>`s with
 * margins collapse unpredictably. A table with explicit widths is the thing
 * that looks the same in Gmail, Apple Mail and Outlook.
 *
 * The signature carries the practice's contact details and, deliberately, the
 * Saturday caveat — someone who reads only the confirmation e-mail and drives
 * to Reigersbos on a Tuesday has been let down by us, not by her.
 */
function layout(bodyHtml: string): string {
	const sand = '#faf0e6';
	const forest = '#3d4a35';
	const muted = '#5f6d56';
	const border = '#dfd0bd';
	const site = SITE_URL;

	return [
		`<div style="margin:0;padding:24px 12px;background:${sand};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${forest}">`,
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#fffaf3;border:1px solid ${border};border-radius:4px">`,
		'<tr><td style="padding:28px 28px 8px">',

		/* Remote images are blocked by default in most clients, so the wordmark
		   is text. It always renders, and it never leaves a broken-image box at
		   the top of the first message someone gets from the practice. */
		`<div style="font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#a8871a;padding-bottom:2px">Trinity</div>`,
		`<div style="font-size:13px;letter-spacing:1px;color:${muted};padding-bottom:20px">Breath &amp; Healing</div>`,

		'</td></tr>',
		`<tr><td style="padding:0 28px 24px;font-size:15px;line-height:1.65;color:${forest}">`,
		bodyHtml,
		'</td></tr>',

		`<tr><td style="padding:18px 28px 24px;border-top:1px solid ${border};font-size:13px;line-height:1.6;color:${muted}">`,
		`<strong style="color:${forest}">${escapeHtml(BRAND.practitionerFullName)}</strong><br>`,
		`${escapeHtml(BRAND.legalName)}<br>`,
		`<a href="mailto:${BRAND.email}" style="color:${muted}">${escapeHtml(BRAND.email)}</a>`,
		` &nbsp;·&nbsp; <a href="tel:${BRAND.phone}" style="color:${muted}">${escapeHtml(BRAND.phoneDisplay)}</a><br>`,
		`<a href="${site}" style="color:${muted}">${escapeHtml(site.replace(/^https?:\/\//, ''))}</a>`,
		`<div style="padding-top:10px;font-size:12px;line-height:1.55;color:${muted}">`,
		`${escapeHtml(BRAND.address.street)}, ${escapeHtml(BRAND.address.floor)} &middot; ${escapeHtml(BRAND.address.postalCode)} ${escapeHtml(BRAND.address.city)}<br>`,
		`${escapeHtml(BRAND.practice.locationNote)} ${escapeHtml(BRAND.practice.homeVisitNote)}`,
		'</div>',
		`<div style="padding-top:10px;font-size:11px;color:${muted}">KvK ${escapeHtml(BRAND.kvk)} &middot; BTW ${escapeHtml(BRAND.vatId)}</div>`,
		'</td></tr>',
		'</table>',
		'</div>'
	].join('');
}

/** The same signature, for the plain-text alternative. */
function textSignature(): string {
	return [
		'',
		'—',
		BRAND.practitionerFullName,
		BRAND.legalName,
		`${BRAND.email} · ${BRAND.phoneDisplay}`,
		SITE_URL.replace(/^https?:\/\//, ''),
		'',
		`${BRAND.address.street}, ${BRAND.address.floor}, ${BRAND.address.postalCode} ${BRAND.address.city}`,
		`${BRAND.practice.locationNote} ${BRAND.practice.homeVisitNote}`,
		`KvK ${BRAND.kvk} · BTW ${BRAND.vatId}`
	].join('\n');
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
			/* Wrapped here rather than at every call site, so no message can
			   ship without the signature and none of them drift apart. */
			text: mail.text + textSignature(),
			html: layout(mail.html),
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
		cancellationHours: number;
	},
	fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
	const text = [
		`Hoi ${args.clientName},`,
		'',
		`Je afspraak is bevestigd: ${args.spokenDate}, ${args.start} - ${args.end} (30 minuten).`,
		'',
		'In de bijlage zit een agenda-uitnodiging die je aan je eigen agenda kunt toevoegen.',
		'',
		'Goed om te weten:',
		`• Tot ${args.cancellationHours} uur van tevoren kun je kosteloos afzeggen of verzetten.`,
		'• Kun je niet? Laat het even weten door op deze mail te antwoorden.',
		'• Dit gesprek is online. Je hoeft niets voor te bereiden.',
		'',
		'Tot dan!'
	].join('\n');

	const html = [
		`<p style="margin:0 0 14px">Hoi ${escapeHtml(args.clientName)},</p>`,
		'<p style="margin:0 0 16px">Je afspraak is <strong>bevestigd</strong>.</p>',
		'<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5eade;border-radius:4px;margin:0 0 16px">',
		'<tr><td style="padding:14px 16px">',
		'<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#5f6d56;padding-bottom:4px">Afspraak</div>',
		`<div style="font-size:16px;color:#3d4a35"><strong>${escapeHtml(args.spokenDate)}</strong></div>`,
		`<div style="font-size:16px;color:#3d4a35"><strong>${escapeHtml(args.start)} – ${escapeHtml(args.end)}</strong> <span style="font-size:13px;color:#5f6d56">(30 minuten)</span></div>`,
		'</td></tr></table>',
		'<p style="margin:0 0 14px">In de bijlage zit een agenda-uitnodiging die je aan je eigen agenda kunt toevoegen.</p>',
		'<p style="margin:0 0 6px;font-size:13px;color:#5f6d56"><strong>Goed om te weten</strong></p>',
		'<ul style="margin:0 0 14px;padding-left:18px;font-size:13px;line-height:1.7;color:#5f6d56">',
		`<li>Tot ${args.cancellationHours} uur van tevoren kun je kosteloos afzeggen of verzetten.</li>`,
		'<li>Kun je niet? Laat het even weten door op deze mail te antwoorden.</li>',
		'<li>Dit gesprek is online. Je hoeft niets voor te bereiden.</li>',
		'</ul>',
		'<p style="margin:0">Tot dan!</p>'
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

/**
 * The immediate acknowledgement, sent to the visitor the moment they request a
 * slot — before the practitioner has looked at it.
 *
 * Without this the visitor gets nothing at all until she answers, and the
 * reasonable conclusion is that the form is broken. They then either give up or
 * submit again, and she gets duplicates of a request she had not yet read. The
 * message therefore has one job above being polite: say clearly that this is a
 * request, not a booking, and say when they will hear back.
 */
export async function sendBookingReceived(
	args: {
		to: string;
		clientName: string;
		spokenDate: string;
		start: string;
		end: string;
		cancellationHours: number;
	},
	fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
	const text = [
		`Hoi ${args.clientName},`,
		'',
		'Je aanvraag is binnengekomen. Dit is nog geen bevestiging.',
		'',
		`Gevraagd moment: ${args.spokenDate}, ${args.start} - ${args.end} (30 minuten).`,
		'',
		'Ik kijk zo snel mogelijk of dit moment lukt en laat het je binnen 48 uur weten.',
		'Zodra ik het bevestig, krijg je een mail met een agenda-uitnodiging.',
		'',
		'Goed om te weten:',
		`• Tot ${args.cancellationHours} uur van tevoren kun je kosteloos afzeggen of verzetten.`,
		'• Een kennismaking van 30 minuten is gratis en verplicht je tot niets.',
		'• Dit gesprek is online. Je krijgt de link bij de bevestiging.',
		'',
		'Vragen in de tussentijd? Antwoord gerust op deze mail.'
	].join('\n');

	const html = [
		`<p style="margin:0 0 14px">Hoi ${escapeHtml(args.clientName)},</p>`,
		'<p style="margin:0 0 14px">Je aanvraag is binnengekomen. <strong>Dit is nog geen bevestiging.</strong></p>',
		`<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5eade;border-radius:4px;margin:0 0 16px">`,
		'<tr><td style="padding:14px 16px">',
		'<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#5f6d56;padding-bottom:4px">Gevraagd moment</div>',
		`<div style="font-size:16px;color:#3d4a35"><strong>${escapeHtml(args.spokenDate)}</strong></div>`,
		`<div style="font-size:16px;color:#3d4a35"><strong>${escapeHtml(args.start)} – ${escapeHtml(args.end)}</strong> <span style="font-size:13px;color:#5f6d56">(30 minuten)</span></div>`,
		'</td></tr></table>',
		'<p style="margin:0 0 14px">Ik kijk zo snel mogelijk of dit moment lukt en laat het je <strong>binnen 48 uur</strong> weten. Zodra ik het bevestig, krijg je een mail met een agenda-uitnodiging.</p>',
		'<p style="margin:0 0 6px;font-size:13px;color:#5f6d56"><strong>Goed om te weten</strong></p>',
		'<ul style="margin:0 0 14px;padding-left:18px;font-size:13px;line-height:1.7;color:#5f6d56">',
		`<li>Tot ${args.cancellationHours} uur van tevoren kun je kosteloos afzeggen of verzetten.</li>`,
		'<li>Een kennismaking van 30 minuten is gratis en verplicht je tot niets.</li>',
		'<li>Dit gesprek is online. Je krijgt de link bij de bevestiging.</li>',
		'</ul>',
		'<p style="margin:0">Vragen in de tussentijd? Antwoord gerust op deze mail.</p>'
	].join('');

	return deliver(
		{
			to: args.to,
			subject: `Aanvraag ontvangen — ${args.spokenDate}, ${args.start}`,
			text,
			html,
			replyTo: env.CONTACT_TO_EMAIL || BRAND.email
		},
		fetchImpl
	);
}
