/**
 * The contact schema is the single gate between a visitor's typing and the
 * inbox — the client renders its messages and the endpoint re-runs it. These
 * cases pin the boundaries both sides depend on.
 */
import { describe, it, expect } from 'vitest';
import { contactSchema, toFieldErrors, emptyContact, isHoneypotTripped } from '$lib/forms/contact';

const valid = {
	voornaam: 'John',
	achternaam: 'Williams',
	email: 'john@example.com',
	landcode: '+31',
	telefoon: '6 123 456 78',
	bericht: 'Ik wil graag meer weten over een eerste sessie.',
	website: ''
};

describe('contactSchema', () => {
	it('accepts a complete submission', () => {
		const result = contactSchema.safeParse(valid);
		expect(result.success).toBe(true);
	});

	it('treats telefoon as optional', () => {
		const result = contactSchema.safeParse({ ...valid, telefoon: '' });
		expect(result.success).toBe(true);
	});

	it('accepts a non-Dutch landcode from the picker', () => {
		const result = contactSchema.safeParse({ ...valid, landcode: '+212', telefoon: '612345678' });
		expect(result.success).toBe(true);
	});

	it('rejects a landcode that is not a dial prefix', () => {
		expect(contactSchema.safeParse({ ...valid, landcode: '31' }).success).toBe(false);
	});

	it('rejects a malformed telefoon with a Dutch message', () => {
		const result = contactSchema.safeParse({ ...valid, telefoon: 'bel me maar' });
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(toFieldErrors(result.error).telefoon).toMatch(/geldig telefoonnummer/i);
	});

	it('trims whitespace before length checks', () => {
		const result = contactSchema.safeParse({ ...valid, voornaam: '   ' });
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(toFieldErrors(result.error).voornaam).toBe('Vul je voornaam in.');
	});

	it('rejects an invalid email', () => {
		const result = contactSchema.safeParse({ ...valid, email: 'john@' });
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(toFieldErrors(result.error).email).toMatch(/geldig e-mailadres/i);
	});

	it('rejects a bericht under 10 characters', () => {
		const result = contactSchema.safeParse({ ...valid, bericht: 'hoi' });
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(toFieldErrors(result.error).bericht).toMatch(/minimaal 10 tekens/i);
	});

	it('parses a filled honeypot rather than rejecting it, and flags it', () => {
		// A 400 would tell a bot which field to skip next time; the endpoint
		// answers with a plain success instead, so parsing has to succeed.
		const result = contactSchema.safeParse({ ...valid, website: 'http://spam.example' });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(isHoneypotTripped(result.data)).toBe(true);
		expect(isHoneypotTripped({ ...result.data, website: '  ' })).toBe(false);
	});

	it('reports every empty required field at once, and never the honeypot', () => {
		const result = contactSchema.safeParse(emptyContact);
		expect(result.success).toBe(false);
		if (result.success) return;
		const errors = toFieldErrors(result.error);
		expect(Object.keys(errors).sort()).toEqual(['achternaam', 'bericht', 'email', 'voornaam']);
	});
});
