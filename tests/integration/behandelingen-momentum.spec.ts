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
 * velocity keeps integrating it (motionTick's coast regime), then a
 * critically-damped spring settles it onto the nearest card (the latch) —
 * never a CSS transition handoff, which is what produced the pause in the
 * first place.
 *
 * This asserts the physical signature of that fix, not an implementation
 * detail: after a fast flick the fan is already moving on the first frames
 * after the pointer lifts (no pause), keeps moving for many frames and more
 * than a card's width (no snap onto the neighbour), and its speed falls over
 * the stretch (decelerating, not constant).
 *
 * Everything is measured by animation frame, and release is marked from
 * inside the page at the pointerup event itself. An earlier version read
 * performance.now() over a separate round trip before mouse.up() and then cut
 * the post-release window by wall-clock offsets from that stamp. Under a
 * loaded parallel run the pointer lifted several frames after the stamp, so
 * the "early" window was mostly stationary frames and the "late" window was
 * the actual coast — it failed with the late speed four times the early one.
 * A sample index taken in the pointerup listener cannot drift like that, and
 * the windows below are slices of the frame sequence, so CPU contention only
 * ever changes how many frames there are, never which frames count.
 *
 * The comparison is on medians of index-thirds rather than on per-frame
 * monotonicity for the same reason. motionTick clamps a stalled frame's dt to
 * 50ms while the measured gap between two samples is not clamped, so one long
 * frame under load reads as a dip in speed followed by a recovery. A median
 * ignores a handful of those; a strict "every frame slower than the last"
 * would fail on exactly the machine this test has to survive on.
 */
import { test, expect, type Page } from '@playwright/test';

const DESKTOP = { width: 1440, height: 900 };

test.use({ viewport: DESKTOP });

// The sampling loop below stashes its results on `window` rather than a
// closure, since it has to survive across the separate `page.evaluate` calls
// that start it, stop it, and read it back.
interface SamplingWindow extends Window {
	__samples: { t: number; pos: number }[];
	__sampling: boolean;
	/** Index of the first sample taken after the pointer lifted; -1 until it does. */
	__releaseIndex: number;
	/** Number of pivots in the fan — the size of the ring --pos wraps around. */
	__ring: number;
}

type Sample = { t: number; pos: number };

async function flickAndSample(page: Page) {
	await page.goto('/');
	await page.locator('.treatments__fan').scrollIntoViewIfNeeded();

	const box = await page.locator('.treatments__fan').boundingBox();
	const x = box!.x + box!.width / 2;
	const y = box!.y + box!.height / 2;

	await page.evaluate(() => {
		const win = window as unknown as SamplingWindow;
		win.__samples = [];
		win.__sampling = true;
		win.__releaseIndex = -1;
		const pivots = document.querySelectorAll<HTMLElement>('.treatments__pivot');
		win.__ring = pivots.length;
		const el = pivots[0]!;
		// Release is a sample index, recorded at the event itself. Capture phase
		// on window so it runs regardless of what the component's own listener
		// does with the event; either way both run in the same task, before
		// the next animation frame, so the index is exact.
		window.addEventListener(
			'pointerup',
			() => {
				win.__releaseIndex = win.__samples.length;
			},
			{ capture: true, once: true }
		);
		function tick() {
			const pos = Number(getComputedStyle(el).getPropertyValue('--pos'));
			win.__samples.push({ t: performance.now(), pos });
			if (win.__sampling) requestAnimationFrame(tick);
		}
		requestAnimationFrame(tick);
	});

	await page.mouse.move(x, y);
	await page.mouse.down();
	// Fast, short flick — real pointer input, not a scripted animation.
	await page.mouse.move(x - 300, y, { steps: 3 });
	await page.mouse.up();

	// Cover coast + latch with headroom.
	await page.waitForTimeout(2500);

	await page.evaluate(() => {
		(window as unknown as SamplingWindow).__sampling = false;
	});

	const { samples, releaseIndex, ring } = await page.evaluate(() => {
		const win = window as unknown as SamplingWindow;
		return { samples: win.__samples, releaseIndex: win.__releaseIndex, ring: win.__ring };
	});
	expect(releaseIndex, 'the pointerup listener must have fired').toBeGreaterThanOrEqual(0);
	return { samples: samples as Sample[], releaseIndex, ring };
}

/* The sampled pivot's --pos is positions[i] + offset, and positions[i] jumps
   by exactly the ring size whenever that card recycles to the other end of
   the fan (see shiftOne in the component). Remove those jumps so the series
   is the one continuous track the fan actually travelled. A real per-frame
   move is always far less than half the ring, so any step beyond that is a
   recycle. */
function unwrap(samples: Sample[], ring: number): Sample[] {
	const out: Sample[] = [];
	for (let i = 0; i < samples.length; i++) {
		if (i === 0) {
			out.push({ ...samples[0]! });
			continue;
		}
		let d = samples[i]!.pos - samples[i - 1]!.pos;
		while (d > ring / 2) d -= ring;
		while (d < -ring / 2) d += ring;
		out.push({ t: samples[i]!.t, pos: out[i - 1]!.pos + d });
	}
	return out;
}

/* Below this a frame counts as still: --pos serialises to six decimals and
   the latch lands on an exact integer, so anything real is well above it. */
const STILL = 1e-4;

/* First index i such that frames i, i+1 and i+2 are all still — the fan has
   come to rest; -1 if it was still moving when sampling stopped. */
function restIndex(displacements: number[]): number {
	for (let i = 0; i + 2 < displacements.length; i++) {
		if (
			Math.abs(displacements[i]!) <= STILL &&
			Math.abs(displacements[i + 1]!) <= STILL &&
			Math.abs(displacements[i + 2]!) <= STILL
		) {
			return i;
		}
	}
	return -1;
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

test('desktop: a fast flick keeps drifting after release and decelerates, rather than snapping or moving at constant speed', async ({
	page
}) => {
	const { samples, releaseIndex, ring } = await flickAndSample(page);

	// Everything from the pointer lifting onward, as one continuous track.
	// The sample at releaseIndex is the first one taken after pointerup — the
	// pre-motion baseline — so displacement 0 is the first frame of release.
	const post = unwrap(samples.slice(releaseIndex), ring);
	const displacements = post.slice(1).map((s, i) => s.pos - post[i]!.pos);
	const gaps = post.slice(1).map((s, i) => s.t - post[i]!.t);
	expect(displacements.length, 'need post-release frames to analyse motion').toBeGreaterThan(10);

	// Only the stretch until the fan comes to rest. Once it has, the idle
	// auto-drift's own countdown is running, and drift is a constant velocity
	// that deliberately never decays — it must not leak into the deceleration
	// measurement below.
	const rest = restIndex(displacements);
	const moving = rest === -1 ? displacements : displacements.slice(0, rest);
	const movingGaps = rest === -1 ? gaps : gaps.slice(0, rest);

	// 1) No pause: the fan is already moving on the first frames after
	// release. The first tick runs in the frame after pointerup and its write
	// is visible to the sampler one frame later, so three frames is exact plus
	// two of headroom — and it is frames, not milliseconds, so a slow machine
	// has the same three.
	expect(
		displacements.slice(0, 3).some((d) => Math.abs(d) > STILL),
		'fan should already be moving in the first frames after release, not paused'
	).toBe(true);

	// 2) No snap: the motion lasts many frames and carries the fan more than a
	// full card. A spring aimed at the nearest card from the moment of release
	// would stop inside a card's width; a coast past the neighbour is the
	// behaviour the component's own release-physics comment cites this test
	// for. Frame counts, not durations: motionTick advances the physics by at
	// most 50ms per frame however long the frame really took, so a hard flick
	// spends dozens of frames coasting on any machine.
	const movingFrames = moving.filter((d) => Math.abs(d) > STILL).length;
	expect(movingFrames, 'fan should keep moving for many frames after release').toBeGreaterThan(10);
	const travel = moving.reduce((sum, d) => sum + d, 0);
	expect(
		Math.abs(travel),
		'a fast flick should carry the fan past its immediate neighbour, not just onto it'
	).toBeGreaterThan(1);

	// 3) Deceleration: speed over the last third of the moving frames is well
	// under speed over the first third. Median per third, not mean, and
	// index-thirds rather than time windows — see the header for why.
	const speeds = moving.map((d, i) => Math.abs(d) / Math.max(movingGaps[i]!, 1));
	const third = Math.ceil(speeds.length / 3);
	const early = median(speeds.slice(0, third));
	const late = median(speeds.slice(-third));
	expect(early, 'need measurable early speed to compare against').toBeGreaterThan(0);
	expect(
		late,
		'speed should fall over the moving stretch (deceleration), not stay flat or rise'
	).toBeLessThan(early * 0.5);
});

test('prefers-reduced-motion: release settles immediately with no lingering drift', async ({
	page
}) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	const { samples, releaseIndex, ring } = await flickAndSample(page);

	const post = unwrap(samples.slice(releaseIndex), ring);
	expect(post.length).toBeGreaterThan(8);

	// Under reduced motion the release settles on the same frame (or the
	// next couple of frames, for the state write to flush) — nothing should
	// still be changing once we're comfortably past release. Six frames of
	// headroom, by frame rather than by clock for the same reason as above.
	const settled = post.slice(6);
	expect(settled.length).toBeGreaterThan(0);
	const drift = Math.max(...settled.map((s) => s.pos)) - Math.min(...settled.map((s) => s.pos));
	expect(
		drift,
		'no lingering movement once past the settle frame under prefers-reduced-motion'
	).toBeLessThan(1e-6);
});
