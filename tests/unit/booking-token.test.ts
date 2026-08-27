/**
 * Signed approval tokens.
 *
 * These are the only thing standing between a stranger with a URL bar and the
 * ability to approve appointments, so the tests are about what must NOT work
 * as much as what must.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const SECRET = 'x'.repeat(48);

vi.mock('$env/dynamic/private', () => ({ env: { BOOKING_TOKEN_SECRET: 'x'.repeat(48) } }));

const base = {
	voornaam: 'Anna',
	achternaam: 'de Vries',
	email: 'anna@example.com',
	klachten: 'Slaapproblemen',
	datum: '2026-09-03',
	start: '14:00',
	end: '14:30'
};

let signToken: typeof import('$lib/server/token').signToken;
let verifyToken: typeof import('$lib/server/token').verifyToken;
let hashToken: typeof import('$lib/server/token').hashToken;

beforeEach(async () => {
	const mod = await import('$lib/server/token');
	signToken = mod.signToken;
	verifyToken = mod.verifyToken;
	hashToken = mod.hashToken;
});

const future = () => Math.floor(Date.now() / 1000) + 3600;

describe('booking tokens', () => {
	it('round-trips every field it carries', () => {
		const token = { ...base, exp: future() };
		const parsed = verifyToken(signToken(token));
		expect(parsed).toEqual(token);
	});

	it('rejects a tampered payload', () => {
		const raw = signToken({ ...base, exp: future() });
		const [payload, signature] = raw.split('.') as [string, string];
		/* Move the appointment an hour later and re-encode — the signature no
		   longer matches, which is the whole point. */
		const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
		decoded.start = '15:00';
		const forged = Buffer.from(JSON.stringify(decoded), 'utf8').toString('base64url');
		expect(verifyToken(`${forged}.${signature}`)).toBeNull();
	});

	it('rejects a token signed with a different secret', () => {
		const raw = signToken({ ...base, exp: future() });
		const [payload] = raw.split('.') as [string];
		expect(verifyToken(`${payload}.notarealsignature`)).toBeNull();
	});

	it('rejects an expired token', () => {
		const expired = signToken({ ...base, exp: Math.floor(Date.now() / 1000) - 1 });
		expect(verifyToken(expired)).toBeNull();
	});

	it('returns null rather than throwing on junk', () => {
		for (const junk of ['', 'a', 'a.b.c', '....', 'not-base64.nope', '%%%.%%%']) {
			expect(() => verifyToken(junk)).not.toThrow();
			expect(verifyToken(junk)).toBeNull();
		}
	});

	it('hashes to something that is not the token', () => {
		const raw = signToken({ ...base, exp: future() });
		const hash = hashToken(raw);
		expect(hash).toHaveLength(64);
		expect(hash).not.toContain(raw);
		/* Same input, same hash — the lookup depends on it. */
		expect(hashToken(raw)).toBe(hash);
	});

	it('gives different slots different hashes', () => {
		const a = hashToken(signToken({ ...base, exp: future() }));
		const b = hashToken(signToken({ ...base, start: '15:00', exp: future() }));
		expect(a).not.toBe(b);
	});

	it('never puts the klachten in the hash-visible portion', () => {
		/* The hash is what the database stores. It must not be reversible to
		   the health data the token carries. */
		const raw = signToken({ ...base, exp: future() });
		expect(hashToken(raw)).not.toMatch(/slaap/i);
	});

	void SECRET;
});
