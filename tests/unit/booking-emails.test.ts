/**
 * The three messages a visitor can receive, and the one the practitioner gets.
 *
 * These assert the things that are invisible until someone is confused by them:
 * that the acknowledgement does not claim to be a confirmation, that the terms
 * quoted match the ones in the algemene voorwaarden, and that every message
 * carries the signature and the Saturday caveat.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
	env: {
		RESEND_API_KEY: 'test',
		CONTACT_FROM_EMAIL: 'Trinity <contact@trinitybreathhealing.nl>',
		CONTACT_TO_EMAIL: 'inbox@example.com'
	}
}));
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_SITE_URL: 'https://trinitybreathhealing.nl' }
}));

import { sendBookingReceived, sendBookingApproved, sendBookingRejected } from '$lib/server/email';
import { CANCELLATION_HOURS } from '$lib/legal/meta';
import { BRAND } from '$lib/constants/brand';

/** Capture what would have gone to Resend. */
function capture() {
	const sent: { html: string; text: string; subject: string; to: string[] }[] = [];
	const fake = (async (_url: string, init: RequestInit) => {
		sent.push(JSON.parse(init.body as string));
		return new Response(JSON.stringify({ id: 'x' }), { status: 200 });
	}) as unknown as typeof fetch;
	return { sent, fake };
}

const slot = { spokenDate: 'woensdag 1 oktober 2026', start: '10:00', end: '10:30' };

describe('booking e-mails', () => {
	it('the acknowledgement says it is NOT a confirmation', async () => {
		const { sent, fake } = capture();
		await sendBookingReceived(
			{
				to: 'anna@example.com',
				clientName: 'Anna',
				...slot,
				cancellationHours: CANCELLATION_HOURS
			},
			fake
		);
		const mail = sent[0]!;
		expect(mail.to).toEqual(['anna@example.com']);
		/* The whole reason this message exists: a visitor who hears nothing
		   assumes the form is broken and books again. It has to be unmistakably
		   an acknowledgement, not a booking. */
		expect(mail.subject).toContain('Aanvraag ontvangen');
		expect(mail.text).toContain('nog geen bevestiging');
		expect(mail.html).toContain('nog geen bevestiging');
		expect(mail.text).toContain('binnen 48 uur');
	});

	it('quotes the same cancellation window the terms use', async () => {
		const { sent, fake } = capture();
		await sendBookingReceived(
			{ to: 'a@b.nl', clientName: 'Anna', ...slot, cancellationHours: CANCELLATION_HOURS },
			fake
		);
		await sendBookingApproved(
			{
				to: 'a@b.nl',
				clientName: 'Anna',
				...slot,
				ics: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR',
				cancellationHours: CANCELLATION_HOURS
			},
			fake
		);
		for (const mail of sent) {
			expect(mail.text).toContain(`${CANCELLATION_HOURS} uur van tevoren`);
		}
	});

	it('every message carries the signature and the Saturday caveat', async () => {
		const { sent, fake } = capture();
		await sendBookingReceived(
			{ to: 'a@b.nl', clientName: 'Anna', ...slot, cancellationHours: CANCELLATION_HOURS },
			fake
		);
		await sendBookingRejected(
			{
				to: 'a@b.nl',
				clientName: 'Anna',
				spokenDate: slot.spokenDate,
				start: slot.start,
				bookingUrl: 'https://x/#contact'
			},
			fake
		);
		for (const mail of sent) {
			expect(mail.text).toContain(BRAND.practitionerFullName);
			expect(mail.text).toContain(BRAND.phoneDisplay);
			expect(mail.text).toContain(`KvK ${BRAND.kvk}`);
			/* Someone who reads only the e-mail must not drive to Reigersbos on
			   a Tuesday. */
			expect(mail.text).toContain(BRAND.practice.locationNote);
			expect(mail.html).toContain(BRAND.kvk);
		}
	});

	it('the approval attaches the invitation', async () => {
		const { sent, fake } = capture();
		await sendBookingApproved(
			{
				to: 'a@b.nl',
				clientName: 'Anna',
				...slot,
				ics: 'BEGIN:VCALENDAR\r\nEND:VCALENDAR',
				cancellationHours: CANCELLATION_HOURS
			},
			fake
		);
		const mail = sent[0] as unknown as {
			attachments: { filename: string; content: string; content_type: string }[];
		};
		expect(mail.attachments).toHaveLength(1);
		expect(mail.attachments[0]!.filename).toBe('afspraak.ics');
		expect(mail.attachments[0]!.content_type).toContain('method=REQUEST');
		/* Base64, because that is what Resend expects — sending raw text here
		   produces an attachment every client refuses to open. */
		expect(Buffer.from(mail.attachments[0]!.content, 'base64').toString('utf8')).toContain(
			'BEGIN:VCALENDAR'
		);
	});

	it('the decline points back at the planner and does not invent a reason', async () => {
		const { sent, fake } = capture();
		await sendBookingRejected(
			{
				to: 'a@b.nl',
				clientName: 'Anna',
				spokenDate: slot.spokenDate,
				start: slot.start,
				bookingUrl: 'https://trinitybreathhealing.nl/#contact'
			},
			fake
		);
		const mail = sent[0]!;
		expect(mail.text).toContain('https://trinitybreathhealing.nl/#contact');
		expect(mail.text).not.toMatch(/helaas.*(vol|druk|geen tijd)/i);
	});
});
