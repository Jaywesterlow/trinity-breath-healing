/**
 * POST /api/contact — receives the landing-page contact form.
 *
 * The rest of the site is prerendered SSG (root +layout.ts); this single route
 * opts out and runs as a Vercel Function in fra1, so the marketing pages keep
 * their static HTML for crawlers while the form still has somewhere to post.
 *
 * Accepts both JSON (fetch, the enhanced path) and urlencoded form data (a
 * native <form> submit when JS never ran) and answers in kind: JSON for JSON,
 * a small HTML page for a browser navigation.
 */
import { json, text, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import {
	contactSchema,
	toFieldErrors,
	isHoneypotTripped,
	type FieldErrors
} from '$lib/forms/contact';
import { sendContactEmail, isEmailConfigured } from '$lib/server/email';
import { BRAND } from '$lib/constants/brand';

export const prerender = false;

/**
 * Per-IP throttle. Best-effort: serverless instances are not shared, but it
 * still blunts the cheap case of one client hammering the endpoint.
 *
 * CONTACT_RATE_LIMIT_MAX exists because the integration suite posts here
 * repeatedly from a single address — without a way to raise the ceiling, the
 * tests throttle themselves and their results depend on run order. Production
 * leaves it unset and gets the default.
 */
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
	rateLimited:
		'Er zijn net te veel berichten verstuurd. Probeer het over een paar minuten opnieuw.',
	unconfigured: `Het formulier is nog niet actief. Mail gerust rechtstreeks naar ${BRAND.email}.`,
	upstream: `Het bericht kon niet worden verzonden. Mail gerust rechtstreeks naar ${BRAND.email}.`,
	success: 'Bedankt voor je bericht. Ik neem zo snel mogelijk contact met je op.'
} as const;

async function readBody(request: Request): Promise<Record<string, unknown>> {
	const type = request.headers.get('content-type') ?? '';
	if (type.includes('application/json')) {
		return (await request.json().catch(() => ({}))) as Record<string, unknown>;
	}
	const form = await request.formData();
	return Object.fromEntries(
		[...form.entries()].map(([k, v]) => [k, typeof v === 'string' ? v : ''])
	);
}

/** A browser navigating here without JS wants a page, not a JSON blob. */
function wantsHtml(request: Request): boolean {
	const accept = request.headers.get('accept') ?? '';
	return accept.includes('text/html') && !accept.includes('application/json');
}

function htmlResponse(status: number, heading: string, message: string): Response {
	const body = `<!doctype html><html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${heading} — ${BRAND.shortName}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf0e6;color:#3d4a35;font:400 1rem/1.5 system-ui,sans-serif;padding:2rem}main{max-width:32rem;text-align:center}a{color:inherit}</style>
</head><body><main><h1>${heading}</h1><p>${message}</p><p><a href="/#contact">Terug naar de site</a></p></main></body></html>`;
	return text(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function fail(request: Request, status: number, message: string, errors?: FieldErrors): Response {
	if (wantsHtml(request)) return htmlResponse(status, 'Er ging iets mis', message);
	return json({ ok: false, message, errors: errors ?? {} }, { status });
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	if (rateLimited(getClientAddress())) return fail(request, 429, MESSAGES.rateLimited);

	const raw = await readBody(request);
	const parsed = contactSchema.safeParse(raw);

	if (!parsed.success) {
		return fail(request, 400, MESSAGES.invalid, toFieldErrors(parsed.error));
	}

	// Honeypot tripped — answer as if sent, tell the bot nothing.
	if (isHoneypotTripped(parsed.data)) {
		return wantsHtml(request)
			? htmlResponse(200, 'Bedankt', MESSAGES.success)
			: json({ ok: true, message: MESSAGES.success });
	}

	if (!isEmailConfigured()) return fail(request, 503, MESSAGES.unconfigured);

	const result = await sendContactEmail(parsed.data);
	if (!result.ok) {
		if (result.reason === 'upstream') console.error('[contact] resend failed:', result.detail);
		return fail(request, 502, MESSAGES.upstream);
	}

	return wantsHtml(request)
		? htmlResponse(200, 'Bedankt', MESSAGES.success)
		: json({ ok: true, message: MESSAGES.success });
};
