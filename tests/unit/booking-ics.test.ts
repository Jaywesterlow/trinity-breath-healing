/**
 * The calendar invitation.
 *
 * Most of what makes an .ics work is invisible until a client refuses it, so
 * these assert the parts that clients are strict about: CRLF, METHOD, line
 * folding, and escaping.
 */
import { describe, it, expect } from 'vitest';
import { buildInvite } from '$lib/server/ics';

/**
 * Undo RFC 5545 folding, the way a real client does before parsing. Assertions
 * about property values have to run against unfolded text — folding is
 * allowed to split anywhere, including through the middle of "RSVP=TRUE".
 */
const unfold = (ics: string) => ics.replace(/\r\n /g, '');

const invite = () =>
	buildInvite({
		uid: 'abc123@trinitybreathhealing.nl',
		datum: '2026-09-03',
		start: '14:00',
		end: '14:30',
		clientName: 'Anna de Vries',
		clientEmail: 'anna@example.com',
		organiserEmail: 'info@trinitybreathhealing.nl'
	});

describe('buildInvite', () => {
	it('is a complete VCALENDAR with one VEVENT', () => {
		const ics = invite();
		expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
		expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
		expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
		expect(ics.match(/END:VEVENT/g)).toHaveLength(1);
	});

	it('uses CRLF line endings, which Outlook requires', () => {
		const ics = invite();
		expect(ics).toContain('\r\n');
		/* No bare LF anywhere: every \n must be preceded by \r. */
		expect(/[^\r]\n/.test(ics)).toBe(false);
	});

	it('is METHOD:REQUEST, so Gmail renders RSVP buttons', () => {
		expect(invite()).toContain('METHOD:REQUEST');
	});

	it('writes floating local times — no Z, no TZID', () => {
		const ics = invite();
		expect(ics).toContain('DTSTART:20260903T140000');
		expect(ics).toContain('DTEND:20260903T143000');
		expect(ics).not.toMatch(/DTSTART[^\r\n]*Z/);
		expect(ics).not.toMatch(/DTSTART;TZID/);
	});

	it('names both parties', () => {
		const ics = unfold(invite());
		expect(ics).toContain('mailto:info@trinitybreathhealing.nl');
		expect(ics).toContain('mailto:anna@example.com');
		expect(ics).toContain('RSVP=TRUE');
	});

	it('folds lines to 75 octets with a leading space on continuations', () => {
		const ics = buildInvite({
			uid: 'x@y',
			datum: '2026-09-03',
			start: '14:00',
			end: '14:30',
			clientName: 'Annabella Wilhelmina Constantina van der Bergen-Hoogstraten',
			clientEmail: 'a.very.long.address.indeed@an-extremely-long-domain-name.example.com',
			organiserEmail: 'info@trinitybreathhealing.nl'
		});
		for (const line of ics.split('\r\n')) {
			expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
		}
		/* Folding happened, and continuations are marked the way the spec says. */
		expect(ics).toMatch(/\r\n /);
	});

	it('escapes commas and semicolons in a name', () => {
		const ics = buildInvite({
			uid: 'x@y',
			datum: '2026-09-03',
			start: '14:00',
			end: '14:30',
			clientName: 'Vries, Anna de; test',
			clientEmail: 'anna@example.com',
			organiserEmail: 'info@trinitybreathhealing.nl'
		});
		/* An unescaped comma would end the property value and corrupt the
		   ATTENDEE line for every client that parses strictly. */
		const attendee = unfold(ics)
			.split('\r\n')
			.find((l) => l.startsWith('ATTENDEE'))!;
		expect(attendee).toContain('\\,');
		/* And the semicolon in the name, which would otherwise end the CN
		   parameter and shift everything after it into the wrong property. */
		expect(attendee).toContain('\\;');
	});
});
