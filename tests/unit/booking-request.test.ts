/**
 * The booking schema gates what reaches the practitioner's inbox. The planner
 * renders its messages and /api/booking re-runs it, so both sides are pinned
 * here.
 */
import { describe, it, expect } from 'vitest';
import { bookingSchema, isBookingHoneypotTripped, toBookingErrors } from '$lib/booking/booking';

const valid = {
	voornaam: 'John',
	achternaam: 'Williams',
	email: 'john@example.com',
	klachten: 'Ik slaap al maanden slecht.',
	datum: '2026-06-08',
	start: '12:30',
	end: '13:00',
	website: ''
};

describe('bookingSchema', () => {
	it('accepts a complete request', () => {
		expect(bookingSchema.safeParse(valid).success).toBe(true);
	});

	it('treats klachten as optional', () => {
		const result = bookingSchema.safeParse({ ...valid, klachten: '' });
		expect(result.success).toBe(true);
	});

	it('reports every empty name field at once, in Dutch', () => {
		const result = bookingSchema.safeParse({ ...valid, voornaam: '  ', achternaam: '' });
		expect(result.success).toBe(false);
		if (result.success) return;
		const errors = toBookingErrors(result.error);
		expect(errors.voornaam).toBe('Vul je voornaam in.');
		expect(errors.achternaam).toBe('Vul je achternaam in.');
	});

	it('rejects an invalid email', () => {
		const result = bookingSchema.safeParse({ ...valid, email: 'john@' });
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(toBookingErrors(result.error).email).toMatch(/geldig e-mailadres/i);
	});

	it('rejects a malformed date or time outright', () => {
		expect(bookingSchema.safeParse({ ...valid, datum: '8-6-2026' }).success).toBe(false);
		expect(bookingSchema.safeParse({ ...valid, start: '25:00' }).success).toBe(false);
		expect(bookingSchema.safeParse({ ...valid, end: 'noon' }).success).toBe(false);
	});

	it('parses a filled honeypot rather than rejecting it, and flags it', () => {
		const result = bookingSchema.safeParse({ ...valid, website: 'http://spam.example' });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(isBookingHoneypotTripped(result.data)).toBe(true);
		expect(isBookingHoneypotTripped({ ...result.data, website: '   ' })).toBe(false);
	});

	it('never surfaces slot or honeypot fields as user-facing errors', () => {
		const result = bookingSchema.safeParse({ ...valid, datum: 'nope', start: 'nope' });
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(Object.keys(toBookingErrors(result.error))).toEqual([]);
	});
});
