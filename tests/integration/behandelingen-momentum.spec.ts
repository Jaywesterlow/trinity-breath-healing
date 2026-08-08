/**
 * behandelingen-momentum.spec.ts — post-release momentum on the
 * Behandelingen fan (src/lib/components/global/Behandelingen.svelte).
 *
 * Release used to hand off to a discrete step-count animation: distance and
 * exit velocity picked a fixed number of cards up front, then a cascade of
 * already-eased CSS-transition hops fired FAST_STEP_MS apart. That produced
 * two symptoms from a single cause — a pause while the first hop waited to
 * start, then rigid, constant-speed hops with nothing decaying. Release now
 * stays on the same continuous offset the drag itself drives: a decaying
 * velocity keeps integrating it (momentumTick), then a short per-frame ease
 * settles it onto the nearest card (settleTick) — never a CSS transition
 * handoff, which is what produced the pause in the first place.
 *
 * This asserts the actual physical signature of that fix, not an
 * implementation detail: after a fast flick, --pos keeps changing for a
 * real stretch of time after the pointer lifts (not stopping instantly, not
 * waiting to start), and the rate of change trends down over that stretch
 * (decelerating, not constant speed). Both time-window comparisons are
 * relative, not fixed-millisecond thresholds, so this isn't tied to the
 * exact tuning of MOMENTUM_TAU_MS/SETTLE_DURATION_MS in the component and
 * won't go flaky if those are retuned later — it just has to still decay.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };

test.use({ viewport: DESKTOP });

async function flickAndSample(page: Page) {
	await page.goto('/');
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();

	const box = await page.locator('.treatments__fan').boundingBox();
	const x = box!.x + box!.width / 2;
	const y = box!.y + box!.height / 2;

	await page.evaluate(() => {
		(window as any).__samples = [];
		(window as any).__sampling = true;
		const el = document.querySelector('.treatments__pivot') as HTMLElement;
		function tick() {
			const pos = Number(getComputedStyle(el).getPropertyValue('--pos'));
			(window as any).__samples.push({ t: performance.now(), pos });
			if ((window as any).__sampling) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	});

	await page.mouse.move(x, y);
	await page.mouse.down();
	// Fast, short flick — real time, not a scripted animation.
	await page.mouse.move(x - 300, y, { steps: 3 });
	const releaseTime = await page.evaluate(() => performance.now());
	await page.mouse.up();

	// Cover momentum decay + settle with headroom.
	await page.waitForTimeout(2500);

	await page.evaluate(() => {
		(window as any).__sampling = false;
	});

	const samples: { t: number; pos: number }[] = await page.evaluate(() => (window as any).__samples);
	return { samples, releaseTime };
}

test('desktop: a fast flick keeps drifting after release and decelerates, rather than snapping or moving at constant speed', async ({
	page
}) => {
	const { samples, releaseTime } = await flickAndSample(page);

	const after = samples.filter((s) => s.t >= releaseTime);
	expect(after.length, 'need enough post-release samples to analyse motion').toBeGreaterThan(10);

	// Per-frame instantaneous speed after release.
	const speeds: { t: number; speed: number }[] = [];
	for (let i = 1; i < after.length; i++) {
		const curr = after[i]!;
		const prev = after[i - 1]!;
		const dt = curr.t - prev.t;
		if (dt <= 0) continue;
		const speed = Math.abs(curr.pos - prev.pos) / dt;
		speeds.push({ t: curr.t - releaseTime, speed });
	}
	expect(speeds.length).toBeGreaterThan(10);

	// 1) Motion does not stop the instant the pointer lifts, and does not
	// wait to start either: real, non-negligible speed shows up within the
	// first couple of frames after release.
	const EPS = 1e-5;
	const immediateSpeed = speeds.slice(0, 3).some((s) => s.speed > EPS);
	expect(immediateSpeed, 'fan should already be moving in the first frames after release, not paused').toBe(true);

	// 2) Motion continues for a real stretch of time — not an instant snap.
	// Find the last frame (relative to release) where the fan was still
	// visibly moving.
	const lastMovingSample = [...speeds].reverse().find((s) => s.speed > EPS);
	expect(lastMovingSample, 'fan should still be moving at some point after release').toBeTruthy();
	expect(
		lastMovingSample!.t,
		'fan should keep moving for a real stretch after release, not stop instantly'
	).toBeGreaterThan(120);

	// 3) Deceleration: average speed over the first slice of the moving
	// window should be meaningfully higher than the average speed over a
	// later slice — a relative comparison, not a fixed threshold, so this
	// holds regardless of exactly how long the whole gesture takes.
	const movingWindow = speeds.filter((s) => s.t <= lastMovingSample!.t);
	const firstThird = movingWindow.slice(0, Math.ceil(movingWindow.length / 3));
	const lastThird = movingWindow.slice(-Math.ceil(movingWindow.length / 3));
	const avg = (arr: { speed: number }[]) => arr.reduce((sum, s) => sum + s.speed, 0) / arr.length;
	const earlyAvg = avg(firstThird);
	const lateAvg = avg(lastThird);

	expect(earlyAvg, 'need measurable early-window speed to compare against').toBeGreaterThan(0);
	expect(
		lateAvg,
		'speed should trend down over the moving window (deceleration), not stay flat or increase'
	).toBeLessThan(earlyAvg * 0.75);
});

test('prefers-reduced-motion: release settles immediately with no lingering drift', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	const { samples, releaseTime } = await flickAndSample(page);

	const after = samples.filter((s) => s.t >= releaseTime);
	expect(after.length).toBeGreaterThan(2);

	// Under reduced motion the release settles on the same frame (or the
	// next couple of frames, for the state write to flush) — nothing should
	// still be changing once we're comfortably past release.
	const settled = after.filter((s) => s.t >= releaseTime + 100);
	expect(settled.length).toBeGreaterThan(0);
	const drift = Math.max(...settled.map((s) => s.pos)) - Math.min(...settled.map((s) => s.pos));
	expect(drift, 'no lingering movement once past the settle frame under prefers-reduced-motion').toBeLessThan(1e-6);
});
