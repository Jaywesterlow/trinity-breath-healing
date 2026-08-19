/**
 * contact-section.spec.ts — the landing-page Contact section end to end.
 *
 * Three contracts live here:
 *   1. The e-mail form validates in the browser before it ever hits the network,
 *      in Dutch, on the field that is wrong.
 *   2. /api/contact re-validates independently — the client check is a courtesy,
 *      not the gate — and swallows the honeypot without telling the bot.
 *   3. The date planner never offers a day in the past and hands a chosen day
 *      off to the booking link.
 *
 * Run AFTER: PUBLIC_SITE_URL=https://trinity-breath-healing.vercel.app npm run build
 */
import { test, expect, type Page } from '@playwright/test';

const VALID = {
	voornaam: 'John',
	achternaam: 'Williams',
	email: 'john@example.com',
	telefoon: '6 123 456 78',
	bericht: 'Ik wil graag meer weten over een eerste sessie.',
	website: ''
};

/** The mode radios are visually hidden by design; people click the label. */
async function chooseMode(page: Page, label: 'Email formulier' | 'Online meeting') {
	await page.getByText(label, { exact: true }).click();
}

async function fillValid(page: Page) {
	await page.getByLabel('Voornaam').fill(VALID.voornaam);
	await page.getByLabel('Achternaam').fill(VALID.achternaam);
	await page.getByLabel('Email', { exact: true }).fill(VALID.email);
	await page.getByLabel('Telefoon').fill(VALID.telefoon);
	await page.getByLabel('Bericht').fill(VALID.bericht);
}

test.describe('Contact — e-mail form', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('#contact').scrollIntoViewIfNeeded();
	});

	test('renders in the initial HTML with every control labelled', async ({ page }) => {
		for (const label of ['Voornaam', 'Achternaam', 'Telefoon', 'Bericht']) {
			await expect(page.getByLabel(label)).toBeVisible();
		}
		await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Verstuur email' })).toBeVisible();
	});

	test('blocks an empty submit client-side and says why, in Dutch', async ({ page }) => {
		let requests = 0;
		page.on('request', (request) => {
			if (request.url().includes('/api/contact')) requests++;
		});

		await page.getByRole('button', { name: 'Verstuur email' }).click();

		await expect(page.getByText('Vul je voornaam in.')).toBeVisible();
		await expect(page.getByText('Vul je e-mailadres in.')).toBeVisible();
		await expect(page.getByText('Schrijf een bericht van minimaal 10 tekens.')).toBeVisible();
		expect(requests, 'an invalid form must never reach the endpoint').toBe(0);

		// The first thing to fix should be where the cursor lands.
		await expect(page.getByLabel('Voornaam')).toBeFocused();
	});

	test('marks a bad e-mail address invalid and links the message to the field', async ({
		page
	}) => {
		await fillValid(page);
		await page.getByLabel('Email', { exact: true }).fill('john@');
		await page.getByRole('button', { name: 'Verstuur email' }).click();

		const email = page.getByLabel('Email', { exact: true });
		await expect(email).toHaveAttribute('aria-invalid', 'true');
		await expect(email).toHaveAttribute('aria-describedby', 'contact-email-error');
		await expect(page.locator('#contact-email-error')).toContainText('geldig e-mailadres');
	});

	test('a successful send confirms in the status region and clears the form', async ({ page }) => {
		await page.route('**/api/contact', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ ok: true, message: 'Bedankt voor je bericht.' })
			})
		);

		await fillValid(page);
		await page.getByRole('button', { name: 'Verstuur email' }).click();

		await expect(page.locator('#contact-form-status')).toContainText('Bedankt voor je bericht.');
		await expect(page.getByLabel('Voornaam')).toHaveValue('');
		await expect(page.getByLabel('Bericht')).toHaveValue('');
	});

	test('a rejected send surfaces the endpoint’s message instead of failing silently', async ({
		page
	}) => {
		await page.route('**/api/contact', (route) =>
			route.fulfill({
				status: 502,
				contentType: 'application/json',
				body: JSON.stringify({ ok: false, message: 'Het bericht kon niet worden verzonden.' })
			})
		);

		await fillValid(page);
		await page.getByRole('button', { name: 'Verstuur email' }).click();

		await expect(page.locator('#contact-form-status')).toContainText(
			'Het bericht kon niet worden verzonden.'
		);
	});
});

test.describe('Contact — /api/contact', () => {
	test('rejects an invalid payload with 400 and per-field Dutch messages', async ({ request }) => {
		const response = await request.post('/api/contact', {
			data: { ...VALID, email: 'john@', bericht: 'hoi' }
		});
		expect(response.status()).toBe(400);

		const body = await response.json();
		expect(body.ok).toBe(false);
		expect(body.errors.email).toMatch(/geldig e-mailadres/i);
		expect(body.errors.bericht).toMatch(/minimaal 10 tekens/i);
	});

	test('accepts a valid payload — validation is not what stops it', async ({ request }) => {
		const response = await request.post('/api/contact', { data: VALID });
		// 200 when Resend is configured, 503 when it is not; either way the
		// submission itself was well-formed, which is what this asserts.
		expect(response.status(), 'a valid payload must never come back as invalid').not.toBe(400);
		expect(typeof (await response.json()).ok).toBe('boolean');
	});

	test('answers a tripped honeypot with a plain success', async ({ request }) => {
		const response = await request.post('/api/contact', {
			data: { ...VALID, website: 'http://spam.example' }
		});
		expect(response.status()).toBe(200);
		expect((await response.json()).ok).toBe(true);
	});
});

test.describe('Contact — date planner', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.locator('#contact').scrollIntoViewIfNeeded();
		await chooseMode(page, 'Online meeting');
	});

	/** The first day the schedule actually offers — weekends and past days are not it. */
	const openDay = (page: Page) =>
		page.getByRole('gridcell').and(page.locator('button:not([aria-disabled="true"])')).first();

	const times = (page: Page) => page.getByRole('group', { name: /Tijden op/ }).getByRole('button');

	async function toTimeStep(page: Page) {
		await openDay(page).click();
	}

	async function toDetailStep(page: Page) {
		await toTimeStep(page);
		await times(page).nth(5).click();
		await page.getByRole('button', { name: 'Gegevens invullen' }).click();
	}

	test('step 1: month grid and legend, no step controls yet', async ({ page }) => {
		await expect(page.getByRole('grid')).toBeVisible();
		await expect(page.getByText('Beschikbaar')).toBeVisible();
		await expect(page.getByText('Geselecteerd')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Gegevens invullen' })).toHaveCount(0);
	});

	test('cannot leave the current month backwards', async ({ page }) => {
		await expect(page.getByRole('button', { name: 'Vorige maand' })).toBeDisabled();
		expect(await openDay(page).count(), 'the month must offer at least one day').toBeGreaterThan(0);
	});

	test('step 2: a date reveals its times, back names step 1, proceed is disabled', async ({
		page
	}) => {
		const day = openDay(page);
		const dayNumber = (await day.textContent())?.trim();
		await day.click();

		await expect(page.getByText('Beschikbaar')).toHaveCount(0);
		await expect(page.locator('.planner__date')).toContainText(`${dayNumber} `);
		expect(await times(page).count()).toBeGreaterThan(0);

		await expect(page.getByRole('button', { name: 'Kies datum' })).toBeVisible();
		const proceed = page.getByRole('button', { name: 'Gegevens invullen' });
		await expect(proceed, 'no time chosen yet').toBeDisabled();
	});

	test('picking a time enables the proceed button', async ({ page }) => {
		await toTimeStep(page);
		const time = times(page).first();
		await time.click();

		await expect(time).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByRole('button', { name: 'Gegevens invullen' })).toBeEnabled();
	});

	test('step 3: the fields appear, back names step 2, booking is disabled until filled', async ({
		page
	}) => {
		await toDetailStep(page);

		for (const label of ['Voornaam', 'Achternaam']) {
			await expect(page.getByLabel(label)).toBeVisible();
		}
		await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
		await expect(page.getByLabel(/Waar loop je tegenaan/)).toBeVisible();

		// The chosen time joins the date in the heading.
		await expect(page.locator('.planner__date')).toContainText(':');

		await expect(page.getByRole('button', { name: 'Kies tijd' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Boek een gesprek' })).toBeDisabled();
	});

	test('filling name and e-mail enables the booking button', async ({ page }) => {
		await toDetailStep(page);
		await page.getByLabel('Voornaam').fill('John');
		await page.getByLabel('Achternaam').fill('Williams');
		await page.getByLabel('Email', { exact: true }).fill('john@example.com');

		await expect(page.getByRole('button', { name: 'Boek een gesprek' })).toBeEnabled();
	});

	test('back steps one at a time — details to times to calendar', async ({ page }) => {
		await toDetailStep(page);

		await page.getByRole('button', { name: 'Kies tijd' }).click();
		expect(await times(page).count(), 'first press lands on the times').toBeGreaterThan(0);
		await expect(page.getByRole('button', { name: 'Kies datum' })).toBeVisible();

		await page.getByRole('button', { name: 'Kies datum' }).click();
		await expect(page.getByText('Beschikbaar'), 'second press lands on the calendar').toBeVisible();
	});

	test('a successful booking turns the card into a confirmation', async ({ page }) => {
		await page.route('**/api/booking', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ ok: true, message: 'Je aanvraag is verstuurd.' })
			})
		);

		await toDetailStep(page);
		await page.getByLabel('Voornaam').fill('John');
		await page.getByLabel('Achternaam').fill('Williams');
		await page.getByLabel('Email', { exact: true }).fill('john@example.com');
		await page.getByRole('button', { name: 'Boek een gesprek' }).click();

		await expect(page.getByText('Je aanvraag is verstuurd.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Nog een moment plannen' })).toBeVisible();
	});

	test('a rejected booking surfaces the message and keeps the form', async ({ page }) => {
		await page.route('**/api/booking', (route) =>
			route.fulfill({
				status: 409,
				contentType: 'application/json',
				body: JSON.stringify({ ok: false, message: 'Dit moment is niet meer beschikbaar.' })
			})
		);

		await toDetailStep(page);
		await page.getByLabel('Voornaam').fill('John');
		await page.getByLabel('Achternaam').fill('Williams');
		await page.getByLabel('Email', { exact: true }).fill('john@example.com');
		await page.getByRole('button', { name: 'Boek een gesprek' }).click();

		await expect(page.getByText('Dit moment is niet meer beschikbaar.')).toBeVisible();
		await expect(page.getByLabel('Voornaam')).toHaveValue('John');
	});

	test('arrow keys move focus within the grid, across unavailable days', async ({ page }) => {
		const day = openDay(page);
		await day.click();
		const start = Number((await day.textContent())?.trim());

		await page.keyboard.press('ArrowRight');
		await expect(page.locator(`[data-day="${start + 1}"]`)).toBeFocused();
	});
});

test.describe('Contact — /api/booking', () => {
	const slot = { datum: '2026-06-08', start: '12:30', end: '13:00' };
	const person = { voornaam: 'John', achternaam: 'Williams', email: 'john@example.com' };

	test('rejects invalid details with 400 and per-field Dutch messages', async ({ request }) => {
		const response = await request.post('/api/booking', {
			data: { ...person, ...slot, email: 'john@', voornaam: '' }
		});
		expect(response.status()).toBe(400);

		const body = await response.json();
		expect(body.errors.email).toMatch(/geldig e-mailadres/i);
		expect(body.errors.voornaam).toMatch(/voornaam/i);
	});

	test('refuses a slot the schedule does not offer, however valid the payload', async ({
		request
	}) => {
		// 03:00 on a Sunday is well-formed and entirely fictional.
		const response = await request.post('/api/booking', {
			data: { ...person, datum: '2026-06-14', start: '03:00', end: '03:30' }
		});
		expect(response.status()).toBe(409);
		expect((await response.json()).message).toMatch(/niet meer beschikbaar/i);
	});

	test('answers a tripped honeypot with a plain success', async ({ request }) => {
		const response = await request.post('/api/booking', {
			data: { ...person, ...slot, website: 'http://spam.example' }
		});
		expect(response.status()).toBe(200);
		expect((await response.json()).ok).toBe(true);
	});

	test('accepts a slot the schedule really offers', async ({ request }) => {
		// Two weeks out, forced onto a Wednesday — inside the opening hours and
		// clear of the lead time, whenever this suite happens to run.
		const target = new Date();
		target.setDate(target.getDate() + 14);
		target.setDate(target.getDate() + ((3 - (target.getDay() || 7) + 7) % 7));
		const datum = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;

		const response = await request.post('/api/booking', {
			data: { ...person, datum, start: '10:00', end: '10:30' }
		});
		// 200 with Resend configured, 503 without; either way the slot was real.
		expect([400, 409]).not.toContain(response.status());
		expect(typeof (await response.json()).ok).toBe('boolean');
	});
});
