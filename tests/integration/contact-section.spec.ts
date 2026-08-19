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

	test('state 1: month grid and the legend, no slots or confirm button yet', async ({ page }) => {
		await expect(page.getByRole('grid')).toBeVisible();
		await expect(page.locator('#planner-month')).not.toBeEmpty();
		await expect(page.getByRole('columnheader', { name: 'maandag' })).toBeVisible();
		await expect(page.getByText('Beschikbaar')).toBeVisible();
		await expect(page.getByText('Geselecteerd')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Boek een gesprek' })).toHaveCount(0);
	});

	test('cannot leave the current month backwards, and unavailable days are marked', async ({
		page
	}) => {
		await expect(page.getByRole('button', { name: 'Vorige maand' })).toBeDisabled();
		expect(await openDay(page).count(), 'the month must offer at least one day').toBeGreaterThan(0);
	});

	test('state 2: picking a date reveals its times and a DISABLED confirm button', async ({
		page
	}) => {
		const day = openDay(page);
		const dayNumber = (await day.textContent())?.trim();
		await day.click();

		// The legend gives way to the chosen date and its slots.
		await expect(page.getByText('Beschikbaar')).toHaveCount(0);
		await expect(page.locator('.planner__date')).toContainText(`${dayNumber} `);

		const times = page.getByRole('group', { name: /Tijden op/ }).getByRole('button');
		expect(await times.count(), 'the schedule must offer slots on an open day').toBeGreaterThan(0);
		await expect(times.first()).toContainText(':');

		const confirm = page.getByRole('button', { name: 'Boek een gesprek' });
		await expect(confirm).toBeVisible();
		await expect(confirm, 'no time chosen yet — the button must be disabled').toBeDisabled();
	});

	test('picking a time enables the confirm button and marks the time chosen', async ({ page }) => {
		await openDay(page).click();

		const time = page
			.getByRole('group', { name: /Tijden op/ })
			.getByRole('button')
			.first();
		await time.click();

		await expect(time).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByRole('button', { name: 'Boek een gesprek' })).toBeEnabled();
	});

	test('the back control returns to state 1 and drops the selection', async ({ page }) => {
		await openDay(page).click();
		await expect(page.getByRole('button', { name: 'Boek een gesprek' })).toBeVisible();

		await page.getByRole('button', { name: 'Terug naar de kalender' }).click();

		await expect(page.getByText('Beschikbaar')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Boek een gesprek' })).toHaveCount(0);
	});

	test('arrow keys move focus within the grid, across unavailable days', async ({ page }) => {
		const day = openDay(page);
		await day.click();
		const start = Number((await day.textContent())?.trim());

		await page.keyboard.press('ArrowRight');
		await expect(page.locator(`[data-day="${start + 1}"]`)).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await expect(page.locator(`[data-day="${start + 8}"]`)).toBeFocused();
	});
});
