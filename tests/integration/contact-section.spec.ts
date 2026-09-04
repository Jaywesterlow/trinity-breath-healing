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
 * Run AFTER: PUBLIC_SITE_URL=https://trinitybreathhealing.nl npm run build
 */
import { test, expect, type Page } from '@playwright/test';
import { DEFAULT_SCHEDULE, slotsFor } from '../../src/lib/booking/schedule';

/* The opening window is the practitioner's, and it has already moved once — from
   the Figma mock-up's office hours to her real weekday evenings. Tests that name
   a literal "10:00", or reach for the sixth slot, break on every such move for
   no reason: none of them assert anything about which hour it is. Ask the
   schedule instead. */

const VALID = {
	voornaam: 'John',
	achternaam: 'Williams',
	email: 'john@example.com',
	landcode: '+31',
	telefoon: '6 123 456 78',
	bericht: 'Ik wil graag meer weten over een eerste sessie.',
	website: ''
};

/** The section opens on neither route: two cards, and picking one replaces the
 *  pair with that panel. The whole card is the control, so click the card. */
async function chooseMode(page: Page, route: 'bericht' | 'afspraak') {
	const title = route === 'bericht' ? 'Stuur een bericht' : 'Plan een kennismaking';
	await page.locator('.route', { hasText: title }).click();
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
		await chooseMode(page, 'bericht');
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

	test('the country prefix is a picker, and choosing one changes the dial code', async ({
		page
	}) => {
		const trigger = page.getByRole('button', { name: /Landcode/ });
		await expect(trigger).toContainText('+31');
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await trigger.click();
		const list = page.getByRole('listbox', { name: 'Kies een landcode' });
		await expect(list).toBeVisible();

		await list.getByRole('option', { name: /Duitsland/ }).click();
		await expect(trigger).toContainText('+49');
		await expect(list).toHaveCount(0);
	});

	test('the country picker closes on Escape and is keyboard operable', async ({ page }) => {
		const trigger = page.getByRole('button', { name: /Landcode/ });
		await trigger.click();
		await expect(page.getByRole('listbox')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('listbox')).toHaveCount(0);
		await expect(trigger).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Enter');
		await expect(trigger).toContainText('+32');
	});

	test('the message field cannot be dragged bigger than its card', async ({ page }) => {
		const resize = await page.getByLabel('Bericht').evaluate((el) => getComputedStyle(el).resize);
		expect(resize, 'a drag handle let the textarea grow past the card').toBe('none');
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
		await chooseMode(page, 'afspraak');
	});

	/* Both panels live in the DOM at once so the e-mail form stays in the
	   prerendered HTML, and the two share field names — "Voornaam" exists twice.
	   Scoping to the visible pane is what keeps these locators unambiguous. */
	const pane = (page: Page) => page.locator('.contact__pane:not([hidden])');

	/** The first day the schedule actually offers — weekends and past days are not it. */
	const openDay = (page: Page) =>
		pane(page).getByRole('gridcell').and(page.locator('button:not([aria-disabled="true"])')).first();

	const times = (page: Page) => pane(page).getByRole('group', { name: /Tijden op/ }).getByRole('button');

	/** Steps crossfade: for ~160ms both panels are mounted. Wait for one. */
	const settled = (page: Page) => expect(page.locator('.planner__step')).toHaveCount(1);

	/* There is no forward button anywhere in this flow: picking a date is step
	   1's forward and picking a time is step 2's. The only button that moves the
	   booking on is Verzenden, at the end. */
	async function toTimeStep(page: Page) {
		await openDay(page).click();
		await expect(page.locator('.planner__sheet')).toBeVisible();
	}

	async function toDetailStep(page: Page) {
		await toTimeStep(page);
		// .last(), not a fixed index: the window is four slots wide today and was
		// twelve before, and this step only needs *a* time to be chosen.
		await times(page).last().click();
		await settled(page);
	}

	test('step 1: month grid and legend, and the step counter says so', async ({ page }) => {
		await expect(pane(page).getByRole('grid')).toBeVisible();
		await expect(pane(page).getByText('Beschikbaar', { exact: true })).toBeVisible();
		await expect(pane(page).getByText('Niet beschikbaar', { exact: true })).toBeVisible();
		await expect(pane(page).getByText('Stap 1 van 3')).toBeVisible();
		await expect(pane(page).getByRole('button', { name: 'Verder' })).toHaveCount(0);
	});

	test('cannot leave the current month backwards', async ({ page }) => {
		await expect(pane(page).getByRole('button', { name: 'Vorige maand' })).toBeDisabled();
		expect(await openDay(page).count(), 'the month must offer at least one day').toBeGreaterThan(0);
	});

	test('step 2: the times rise over the calendar, which stays put', async ({ page }) => {
		const day = openDay(page);
		const dayNumber = (await day.textContent())?.trim();
		await day.click();
		await expect(page.locator('.planner__sheet')).toBeVisible();

		// The calendar stays: the day just chosen is still visible above the sheet.
		await expect(pane(page).getByRole('grid')).toBeVisible();
		await expect(page.locator('.planner__sheet-date')).toContainText(`${dayNumber} `);
		expect(await times(page).count()).toBeGreaterThan(0);

		await expect(pane(page).getByText('Stap 2 van 3')).toBeVisible();
		await expect(pane(page).getByRole('button', { name: 'Terug naar kies datum' })).toBeVisible();
		await expect(pane(page).getByRole('button', { name: 'Verder' })).toHaveCount(0);
	});

	test('picking a time is the way forward — no button in between', async ({ page }) => {
		await toTimeStep(page);
		await times(page).first().click();
		await settled(page);

		await expect(pane(page).getByText('Stap 3 van 3')).toBeVisible();
		await expect(pane(page).getByLabel('Voornaam')).toBeVisible();
	});

	test('step 3: the fields appear, back names step 2, booking is disabled until filled', async ({
		page
	}) => {
		await toDetailStep(page);

		for (const label of ['Voornaam', 'Achternaam']) {
			await expect(pane(page).getByLabel(label)).toBeVisible();
		}
		await expect(pane(page).getByLabel('Email', { exact: true })).toBeVisible();
		await expect(pane(page).getByLabel(/Waar loop je tegenaan/)).toBeVisible();

		// The chosen time joins the date in the heading.
		await expect(page.locator('.planner__date')).toContainText(':');

		await expect(pane(page).getByRole('button', { name: 'Terug naar kies tijd' })).toBeVisible();
		await expect(pane(page).getByRole('button', { name: 'Verzenden' })).toBeDisabled();
	});

	test('filling name and e-mail enables the booking button', async ({ page }) => {
		await toDetailStep(page);
		await pane(page).getByLabel('Voornaam').fill('John');
		await pane(page).getByLabel('Achternaam').fill('Williams');
		await pane(page).getByLabel('Email', { exact: true }).fill('john@example.com');

		await expect(pane(page).getByRole('button', { name: 'Verzenden' })).toBeEnabled();
	});

	test('back steps one at a time — details to times to calendar', async ({ page }) => {
		await toDetailStep(page);

		await pane(page).getByRole('button', { name: 'Terug naar kies tijd' }).click();
		await settled(page);
		expect(await times(page).count(), 'first press lands on the times').toBeGreaterThan(0);
		await expect(pane(page).getByRole('button', { name: 'Kies datum' })).toBeVisible();

		await pane(page).getByRole('button', { name: 'Terug naar kies datum' }).click();
		await settled(page);
		await expect(pane(page).getByRole('grid'), 'second press lands on the calendar').toBeVisible();
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
		await pane(page).getByLabel('Voornaam').fill('John');
		await pane(page).getByLabel('Achternaam').fill('Williams');
		await pane(page).getByLabel('Email', { exact: true }).fill('john@example.com');
		await pane(page).getByRole('button', { name: 'Verzenden' }).click();

		await expect(pane(page).getByText('Je aanvraag is verstuurd.')).toBeVisible();
		await expect(pane(page).getByRole('button', { name: 'Nog een moment plannen' })).toBeVisible();
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
		await pane(page).getByLabel('Voornaam').fill('John');
		await pane(page).getByLabel('Achternaam').fill('Williams');
		await pane(page).getByLabel('Email', { exact: true }).fill('john@example.com');
		await pane(page).getByRole('button', { name: 'Verzenden' }).click();

		await expect(pane(page).getByText('Dit moment is niet meer beschikbaar.')).toBeVisible();
		await expect(pane(page).getByLabel('Voornaam')).toHaveValue('John');
	});

	test('the card never scrolls, on any step', async ({ page }) => {
		const overflow = () =>
			page.locator('.planner').evaluate((n) => n.scrollHeight - n.clientHeight);

		expect(await overflow(), 'step 1 overflows').toBeLessThanOrEqual(1);

		await openDay(page).click();
		await settled(page);
		await times(page).first().click();
		expect(await overflow(), 'step 2 overflows').toBeLessThanOrEqual(1);

		await settled(page);
		await expect(pane(page).getByLabel('Voornaam')).toBeVisible();
		expect(await overflow(), 'step 3 overflows').toBeLessThanOrEqual(1);
	});

	test('the month grid keeps its height when paging between months', async ({ page }) => {
		const grid = pane(page).getByRole('grid');
		const before = (await grid.boundingBox())!.height;

		for (let i = 0; i < 3; i++) {
			await pane(page).getByRole('button', { name: 'Volgende maand' }).click();
			const after = (await grid.boundingBox())!.height;
			expect(Math.abs(after - before), 'a shorter month shifted the layout').toBeLessThan(2);
		}
	});

	test('arrow keys move focus within the grid, across unavailable days', async ({ page }) => {
		// Start at the 1st, not at the first bookable day: near the end of a month
		// ArrowDown clamps to the last day, and which day is first bookable moves
		// with the calendar. The 1st is always present and always focusable —
		// unavailable days carry aria-disabled, not disabled, precisely so the
		// roving tabindex can cross them.
		await page.locator('[data-day="1"]').focus();

		await page.keyboard.press('ArrowRight');
		await expect(page.locator('[data-day="2"]')).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await expect(page.locator('[data-day="9"]')).toBeFocused();

		await page.keyboard.press('End');
		await expect(page.locator('.planner__day:focus')).toHaveCount(1);
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

		const offered = slotsFor(DEFAULT_SCHEDULE, datum, new Date())[0];
		expect(offered, 'the schedule must offer something on a Wednesday').toBeTruthy();

		const response = await request.post('/api/booking', {
			data: { ...person, datum, start: offered!.start, end: offered!.end }
		});
		// 200 with Resend configured, 503 without; either way the slot was real.
		expect([400, 409]).not.toContain(response.status());
		expect(typeof (await response.json()).ok).toBe('boolean');
	});
});
