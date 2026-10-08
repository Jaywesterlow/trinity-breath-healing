/**
 * Signed approval tokens.
 *
 * The token is the reason the database holds no personal data. Everything the
 * decision needs — who booked, their e-mail, what they wrote, which slot —
 * travels inside the token itself, signed so it cannot be altered, and the
 * database only ever stores a hash of it next to a date and a status.
 *
 * Format is `base64url(payload).base64url(hmac)`, deliberately hand-rolled
 * rather than pulling in a JWT library: there is one issuer, one audience and
 * one algorithm here, and a JWT would add a dependency plus a family of
 * algorithm-confusion footguns for no benefit.
 */
import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

export interface BookingToken {
	/* No row id. The database row is found by the hash of this very token, so
	   carrying the id would mean signing once to learn the hash, inserting, then
	   signing again with the id — which changes the hash and breaks the lookup.
	   The id is never needed outside the database. */
	voornaam: string;
	achternaam: string;
	email: string;
	klachten: string;
	datum: string;
	start: string;
	end: string;
	/** Seconds since epoch after which the link stops working. */
	exp: number;
}

function secret(): string {
	const value = env.BOOKING_TOKEN_SECRET;
	if (!value || value.length < 32) {
		throw new Error('BOOKING_TOKEN_SECRET must be set to at least 32 characters.');
	}
	return value;
}

const b64url = (buf: Buffer) => buf.toString('base64url');

function sign(payload: string): string {
	return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function signToken(token: BookingToken): string {
	const payload = b64url(Buffer.from(JSON.stringify(token), 'utf8'));
	return `${payload}.${sign(payload)}`;
}

/**
 * Returns the token, or null for anything that fails: bad shape, bad
 * signature, expired. Never throws on malformed input — this parses whatever a
 * stranger put in the URL bar.
 */
export function verifyToken(raw: string): BookingToken | null {
	const parts = raw.split('.');
	if (parts.length !== 2) return null;
	const [payload, signature] = parts as [string, string];

	let expected: Buffer;
	try {
		expected = Buffer.from(sign(payload), 'utf8');
	} catch {
		return null; // secret missing — treat as unverifiable rather than crashing
	}
	const given = Buffer.from(signature, 'utf8');
	/* timingSafeEqual throws on a length mismatch, and comparing lengths first
	   is not a leak: the signature length is fixed and public. */
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

	let parsed: BookingToken;
	try {
		parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
	} catch {
		return null;
	}
	if (typeof parsed?.exp !== 'number' || parsed.exp * 1000 < Date.now()) return null;
	return parsed;
}

/** What goes in the database, so a leaked row still cannot approve anything. */
export function hashToken(raw: string): string {
	return createHash('sha256').update(raw).digest('hex');
}
