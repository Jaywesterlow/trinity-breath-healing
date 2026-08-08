/**
 * behandelingen-button-retarget.spec.ts — a second button press arriving
 * while the previous one's motion is still running, on the Behandelingen fan
 * (src/lib/components/global/Behandelingen.svelte).
 *
 * Buttons (next/prev/goTo/jumpTo) used to commit through commitSteps, a
 * cascade of discrete, already-settled CSS-transition steps guarded by a
 * `cascading` flag — a second press arriving mid-cascade was simply
 * ignored (`if (cascading) return;`). Now they drive the same continuous
 * offset/spring the pointer path already uses (see driveMotion in the
 * component), so a second press has to do something better than "ignore
 * it": retarget smoothly from wherever the fan currently is and however
 * fast it's currently moving, extending the same motion rather than
 * restarting it from rest or stalling in between.
 *
 * This asserts the actual physical signature of that fix, not an
 * implementation detail: across a rapid double Next press, the item that
 * started centred (i) never sits at (near-)zero speed in the window around
 * the second press (not a stall), (ii) never moves back toward its start
 * once under way (not a restart), (iii) still lands exactly two cards
 * further out — both presses counted — and (iv) the spacing invariant —
 * every pair of cards' --pos differing by exactly 1 — holds at every single
 * sampled frame throughout, including the instant of the retarget itself.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };
test.use({ viewport: DESKTOP });

interface SamplingWindow extends Window {
	__samples: { t: number; pos: number[] }[];
	__sampling: boolean;
}

async function positions(page: Page): Promise<number[]> {
	return page.$$eval('.treatments__pivot', (els) =>
		els.map((el) => Number(getComputedStyle(el).getPropertyValue('--pos')))
	);
}

test('a second Next press mid-flight extends the same motion instead of stalling or restarting', async ({
	page
}) => {
	await page.goto('/');
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();

	// The item centred (--pos === 0) before anything moves. DOM order
	// follows the fixed `items` array order (the keyed each block never
	// reorders its own nodes, only the values it renders), so index
	// `startIndex` keeps referring to this same physical card throughout —
	// same assumption behandelingen-click-to-jump.spec.ts's indexAt makes.
	const startIndex = (await positions(page)).indexOf(0);
	expect(startIndex).toBeGreaterThan(-1);

	await page.evaluate(() => {
		const win = window as unknown as SamplingWindow;
		win.__samples = [];
		win.__sampling = true;
		function tick() {
			const els = document.querySelectorAll('.treatments__pivot');
			const pos = Array.from(els).map((el) =>
				Number(getComputedStyle(el).getPropertyValue('--pos'))
			);
			(window as unknown as SamplingWindow).__samples.push({ t: performance.now(), pos });
			if ((window as unknown as SamplingWindow).__sampling) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	});

	const next = page.getByRole('button', { name: 'Volgende' });
	await next.click();
	// Well before the spring settles (single-step settle lands in ~300ms,
	// see SPRING_OMEGA's own tuning comment in the component) but after
	// real motion has visibly started.
	await page.waitForTimeout(60);
	const secondPressTime = await page.evaluate(() => performance.now());
	await next.click();
	// Long enough for the two-step retarget to fully land at
	// BUTTON_SPRING_OMEGA (see its own comment for the current value) — a
	// two-card retarget starting ~60ms into the first card's own motion
	// measures ~1.87s to settle in isolation at BUTTON_SPRING_OMEGA =
	// SPRING_OMEGA / 4. 3s gives real headroom under parallel-worker CPU
	// contention (this suite is explicitly run alongside four others —
	// see the file-level task instructions — which measurably slows rAF
	// timing down; 2.5s was not enough margin under that load).
	await page.waitForTimeout(3000);

	await page.evaluate(() => {
		(window as unknown as SamplingWindow).__sampling = false;
	});
	const samples: { t: number; pos: number[] }[] = await page.evaluate(
		() => (window as unknown as SamplingWindow).__samples
	);
	expect(samples.length, 'need real samples captured across both presses').toBeGreaterThan(20);

	// (iv) Spacing invariant, checked at every sampled frame, including
	// across the retarget instant itself.
	let maxSpacingErr = 0;
	for (const s of samples) {
		const sorted = [...s.pos].sort((a, b) => a - b);
		for (let i = 1; i < sorted.length; i++) {
			maxSpacingErr = Math.max(maxSpacingErr, Math.abs(sorted[i]! - sorted[i - 1]! - 1));
		}
	}
	expect(
		maxSpacingErr,
		'adjacent cards must stay exactly 1 apart through the retarget'
	).toBeLessThan(1e-6);

	const track = samples.map((s) => ({ t: s.t, pos: s.pos[startIndex]! }));

	// (iii) Both presses counted: lands exactly two cards further out.
	expect(track[track.length - 1]!.pos).toBe(-2);

	// (ii) No restart: once moving, the tracked card only ever travels
	// further from its start (monotonically more negative) — a restart
	// would show it snapping back toward 0 right around the second press.
	let maxSeenMagnitude = 0;
	let wentBackward = false;
	for (const s of track) {
		const magnitude = -s.pos;
		if (magnitude < maxSeenMagnitude - 1e-6) wentBackward = true;
		maxSeenMagnitude = Math.max(maxSeenMagnitude, magnitude);
	}
	expect(wentBackward, 'a retarget must not snap the fan back toward its start').toBe(false);

	// (i) No stall: instantaneous speed in the window around the second
	// press never drops to (near) zero — the second press has to catch the
	// motion already moving and extend it, not wait for a full stop first.
	const around = track.filter((s) => Math.abs(s.t - secondPressTime) < 150);
	expect(
		around.length,
		'need enough samples around the second press to analyse motion'
	).toBeGreaterThan(3);
	const speeds: number[] = [];
	for (let i = 1; i < around.length; i++) {
		const dt = around[i]!.t - around[i - 1]!.t;
		if (dt <= 0) continue;
		speeds.push(Math.abs(around[i]!.pos - around[i - 1]!.pos) / dt);
	}
	expect(
		speeds.some((s) => s > 1e-5),
		'motion must not stall in the window around the second press'
	).toBe(true);
});
