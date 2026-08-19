/**
 * Resend transport for the contact form.
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
 */
import { env } from '$env/dynamic/private';
import { BRAND } from '$lib/constants/brand';
import type { ContactValues } from '$lib/forms/contact';

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
	const telefoon = values.telefoon ? `+31 ${values.telefoon}` : '—';

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

export async function sendContactEmail(
	values: ContactValues,
	fetchImpl: typeof fetch = fetch
): Promise<SendResult> {
	if (!isEmailConfigured()) return { ok: false, reason: 'unconfigured' };

	const { text, html, naam } = buildBodies(values);

	const response = await fetchImpl('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.CONTACT_FROM_EMAIL,
			to: [env.CONTACT_TO_EMAIL || BRAND.email],
			reply_to: values.email,
			subject: `Contactformulier — ${naam}`,
			text,
			html
		})
	});

	if (!response.ok) {
		const detail = await response.text().catch(() => '');
		return { ok: false, reason: 'upstream', detail: `${response.status} ${detail}`.trim() };
	}

	const payload = (await response.json().catch(() => null)) as { id?: string } | null;
	return { ok: true, id: payload?.id ?? null };
}
