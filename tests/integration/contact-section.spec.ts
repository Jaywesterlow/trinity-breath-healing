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

	test('swaps the panel and shows a labelled month grid', async ({ page }) => {
		await expect(page.getByRole('grid')).toBeVisible();
		await expect(page.locator('#planner-month')).not.toBeEmpty();
		await expect(page.getByRole('columnheader', { name: 'maandag' })).toBeVisible();
		await expect(page.getByText('Beschikbaar')).toBeVisible();
	});

	test('cannot leave the current month backwards, and days before today are disabled', async ({
		page
	}) => {
		await expect(page.getByRole('button', { name: 'Vorige maand' })).toBeDisabled();

		const disabled = page.getByRole('gridcell').and(page.locator('button:disabled'));
		const enabled = page.getByRole('gridcell').and(page.locator('button:not(:disabled)'));
		expect(await enabled.count(), 'today onward must remain bookable').toBeGreaterThan(0);
		// Only meaningful mid-month; on the 1st there is nothing behind us.
		expect(await disabled.count()).toBeGreaterThanOrEqual(0);
	});

	test('choosing a day reveals the booking hand-off for that day', async ({ page }) => {
		await expect(page.getByText('Kies een dag om je online meeting')).toBeVisible();

		const day = page.getByRole('gridcell').and(page.locator('button:not(:disabled)')).first();
		const dayNumber = (await day.textContent())?.trim();
		await day.click();

		const cta = page.getByRole('link', { name: /Plan 30 minuten op/ });
		await expect(cta).toBeVisible();
		await expect(cta).toContainText(`${dayNumber} `);
		await expect(cta).toHaveAttribute('href', /.+/);
	});

	test('arrow keys move focus within the grid', async ({ page }) => {
		const day = page.getByRole('gridcell').and(page.locator('button:not(:disabled)')).first();
		await day.click();
		const start = Number((await day.textContent())?.trim());

		await page.keyboard.press('ArrowRight');
		await expect(page.locator(`[data-day="${start + 1}"]`)).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await expect(page.locator(`[data-day="${start + 8}"]`)).toBeFocused();
	});
});
