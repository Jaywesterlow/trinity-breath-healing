/**
 * The calendar invitation.
 *
 * This is why there is no Google Calendar integration. A .ics with
 * METHOD:REQUEST is the interoperable version of "add this to your calendar":
 * Gmail renders it as an invitation with RSVP buttons, Apple Calendar and
 * Outlook add it on open, and it needs no OAuth, no stored refresh token and
 * no third-party app with standing access to the practitioner's calendar.
 *
 * Times are written as floating local time (no Z, no TZID) to match
 * schedule.ts. The practice and everyone booking it are in Europe/Amsterdam,
 * so 14:00 means 14:00 on both calendars, and there is nothing to get wrong
 * when the clocks change.
 */
import { BRAND } from '$lib/constants/brand';

export interface InviteDetails {
	uid: string;
	datum: string;
	start: string;
	end: string;
	clientName: string;
	clientEmail: string;
	organiserEmail: string;
}

/** "2026-09-03" + "14:00" -> "20260903T140000". */
function stamp(datum: string, time: string): string {
	return `${datum.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function utcStamp(date: Date): string {
	return date
		.toISOString()
		.replace(/[-:]/g, '')
		.replace(/\.\d{3}/, '');
}

/**
 * RFC 5545 caps a line at 75 **octets** — not characters — and continues with
 * a leading space. Long summaries silently corrupt the file without this: some
 * clients drop the property, others render the overflow as literal text.
 *
 * Counting characters is the tempting shortcut and it is wrong. The em dash in
 * the summary is one character and three octets, so a "75-character" line came
 * out at 77 octets and over the limit. This walks by code point tracking the
 * encoded size, and never splits a character across two lines — half a
 * multi-byte sequence is worse than a long line.
 */
function fold(line: string): string {
	if (Buffer.byteLength(line, 'utf8') <= 75) return line;

	const out: string[] = [];
	let current = '';
	let bytes = 0;
	/* The first line gets 75 octets; every continuation spends one on its
	   leading space, leaving 74. */
	let budget = 75;

	for (const char of line) {
		const size = Buffer.byteLength(char, 'utf8');
		if (bytes + size > budget) {
			out.push(current);
			current = '';
			bytes = 0;
			budget = 74;
		}
		current += char;
		bytes += size;
	}
	if (current) out.push(current);

	const [first, ...rest] = out;
	return [first, ...rest.map((part) => ` ${part}`)].join('\r\n');
}

/** Escape the characters that mean something inside a property value. */
function esc(value: string): string {
	return (
		value
			.replace(/\\/g, '\\\\')
			/* Two characters: a backslash and a semicolon. Written '\;' in the
		   source this collapses to a bare ';' — \; is not a JavaScript escape
		   sequence — and the escaping would silently do nothing. */
			.replace(/;/g, '\\;')
			.replace(/,/g, '\\,')
			.replace(/\n/g, '\\n')
	);
}

export function buildInvite(details: InviteDetails): string {
	const summary = `Kennismaking — ${details.clientName}`;
	const description =
		'Kennismakingsgesprek van 30 minuten met ' +
		`${BRAND.legalName}. Vragen vooraf? Antwoord gerust op deze uitnodiging.`;

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		`PRODID:-//${BRAND.legalName}//Booking//NL`,
		'CALSCALE:GREGORIAN',
		/* REQUEST, not PUBLISH: this is an invitation addressed to named
		   attendees, which is what makes Gmail show RSVP buttons rather than a
		   generic "add to calendar" chip. */
		'METHOD:REQUEST',
		'BEGIN:VEVENT',
		`UID:${details.uid}`,
		`DTSTAMP:${utcStamp(new Date())}`,
		`DTSTART:${stamp(details.datum, details.start)}`,
		`DTEND:${stamp(details.datum, details.end)}`,
		fold(`SUMMARY:${esc(summary)}`),
		fold(`DESCRIPTION:${esc(description)}`),
		fold(`ORGANIZER;CN=${esc(BRAND.legalName)}:mailto:${details.organiserEmail}`),
		fold(
			`ATTENDEE;CN=${esc(details.clientName)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${details.clientEmail}`
		),
		'STATUS:CONFIRMED',
		'SEQUENCE:0',
		'BEGIN:VALARM',
		'TRIGGER:-PT1H',
		'ACTION:DISPLAY',
		'DESCRIPTION:Kennismaking over een uur',
		'END:VALARM',
		'END:VEVENT',
		'END:VCALENDAR'
	];
	/* CRLF, per the spec. Some clients tolerate bare LF; Outlook is not
	   reliably one of them. */
	return lines.join('\r\n');
}
