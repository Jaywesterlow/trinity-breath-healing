<script lang="ts">
	/**
	 * Online-meeting planner (Figma: Mobile _ Home 5).
	 *
	 * Picks the day; Cal.com owns the actual slots. Selecting a date hands off to
	 * the booking page pre-scrolled to that month/day, which keeps the heavy
	 * third-party embed off the landing page entirely — the LCP/INP budget in
	 * CLAUDE.md does not survive an iframe here, and a crawler gains nothing
	 * from one.
	 *
	 * PUBLIC_CALCOM_LINK is read through $env/dynamic/public so an unset value is
	 * never a build error: without it the CTA falls back to an e-mail with the
	 * chosen date filled in, which still converts.
	 */
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { BRAND } from '$lib/constants/brand';

	const MONTHS = [
		'januari',
		'februari',
		'maart',
		'april',
		'mei',
		'juni',
		'juli',
		'augustus',
		'september',
		'oktober',
		'november',
		'december'
	];
	/** Monday-first, matching the M D W D V Z Z header in the design. */
	const WEEKDAYS = [
		{ short: 'M', long: 'maandag' },
		{ short: 'D', long: 'dinsdag' },
		{ short: 'W', long: 'woensdag' },
		{ short: 'D', long: 'donderdag' },
		{ short: 'V', long: 'vrijdag' },
		{ short: 'Z', long: 'zaterdag' },
		{ short: 'Z', long: 'zondag' }
	];

	/**
	 * Server render and first hydration both use the build date, so the markup
	 * matches on both sides; onMount swaps in the visitor's real today.
	 */
	const buildToday = startOfDay(new Date(`${__BUILD_DATE__}T00:00:00`));
	let today = $state(buildToday);
	let viewYear = $state(buildToday.getFullYear());
	let viewMonth = $state(buildToday.getMonth());
	let selected = $state<string | null>(null);
	let focusedDay = $state(0); // 1-based day number holding the roving tabindex; 0 = none yet

	onMount(() => {
		const real = startOfDay(new Date());
		if (real.getTime() === today.getTime()) return;
		today = real;
		viewYear = real.getFullYear();
		viewMonth = real.getMonth();
	});

	function startOfDay(date: Date): Date {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}

	function iso(year: number, month: number, day: number): string {
		return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	}

	/** JS puts Sunday at 0; the grid starts on Monday. */
	function mondayIndex(date: Date): number {
		return (date.getDay() + 6) % 7;
	}

	const daysInMonth = $derived(new Date(viewYear, viewMonth + 1, 0).getDate());
	const leadingBlanks = $derived(mondayIndex(new Date(viewYear, viewMonth, 1)));
	const monthLabel = $derived(`${MONTHS[viewMonth]!} ${viewYear}`);

	/** Nothing before today is bookable, so the previous arrow stops at this month. */
	const atFirstMonth = $derived(viewYear === today.getFullYear() && viewMonth === today.getMonth());

	const weeks = $derived.by(() => {
		const cells: (number | null)[] = [
			...Array.from({ length: leadingBlanks }, () => null),
			...Array.from({ length: daysInMonth }, (_, i) => i + 1)
		];
		while (cells.length % 7 !== 0) cells.push(null);
		return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
	});

	const firstSelectableDay = $derived(atFirstMonth ? today.getDate() : 1);

	function isPast(day: number): boolean {
		return new Date(viewYear, viewMonth, day).getTime() < today.getTime();
	}

	function labelFor(day: number): string {
		const date = new Date(viewYear, viewMonth, day);
		return `${WEEKDAYS[mondayIndex(date)]!.long} ${day} ${MONTHS[viewMonth]!} ${viewYear}`;
	}

	function shiftMonth(delta: number) {
		if (delta < 0 && atFirstMonth) return;
		const next = new Date(viewYear, viewMonth + delta, 1);
		viewYear = next.getFullYear();
		viewMonth = next.getMonth();
		focusedDay = 0;
	}

	function select(day: number) {
		selected = iso(viewYear, viewMonth, day);
		focusedDay = day;
	}

	function focusDay(day: number) {
		focusedDay = day;
		queueMicrotask(() => {
			document.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
		});
	}

	function onKeydown(event: KeyboardEvent, day: number) {
		const moves: Record<string, number> = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -7,
			ArrowDown: 7
		};
		let target: number;

		if (event.key in moves) target = day + moves[event.key]!;
		else if (event.key === 'Home') target = firstSelectableDay;
		else if (event.key === 'End') target = daysInMonth;
		else return;

		event.preventDefault();
		const clamped = Math.min(Math.max(target, firstSelectableDay), daysInMonth);
		focusDay(clamped);
	}

	const selectedLabel = $derived.by(() => {
		if (!selected) return null;
		const [year, month, day] = selected.split('-').map(Number) as [number, number, number];
		const date = new Date(year, month - 1, day);
		return `${WEEKDAYS[mondayIndex(date)]!.long} ${day} ${MONTHS[month - 1]!} ${year}`;
	});

	const calcomLink = $derived(env.PUBLIC_CALCOM_LINK ?? '');

	const bookingHref = $derived.by(() => {
		if (!selected) return null;
		if (calcomLink) {
			const separator = calcomLink.includes('?') ? '&' : '?';
			return `${calcomLink}${separator}date=${selected}&month=${selected.slice(0, 7)}`;
		}
		// No Cal.com link configured yet — an e-mail with the date in it still books.
		const subject = encodeURIComponent('Aanvraag online meeting (30 minuten)');
		const body = encodeURIComponent(
			`Hallo,\n\nIk wil graag een online meeting van 30 minuten inplannen op ${selectedLabel}.\n\nMet vriendelijke groet,\n`
		);
		return `mailto:${BRAND.email}?subject=${subject}&body=${body}`;
	});
</script>

<div class="planner">
	<div class="planner__header">
		<button
			class="planner__nav"
			type="button"
			onclick={() => shiftMonth(-1)}
			disabled={atFirstMonth}
			aria-label="Vorige maand"
		>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<path
					d="M16 10H4M4 10L9 5M4 10L9 15"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
		<p class="planner__month" id="planner-month" aria-live="polite">{monthLabel}</p>
		<button
			class="planner__nav"
			type="button"
			onclick={() => shiftMonth(1)}
			aria-label="Volgende maand"
		>
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
				<path
					d="M4 10H16M16 10L11 5M16 10L11 15"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>

	<div class="planner__grid" role="grid" aria-labelledby="planner-month">
		<div class="planner__row planner__row--head" role="row">
			{#each WEEKDAYS as weekday (weekday.long)}
				<span class="planner__weekday" role="columnheader" aria-label={weekday.long}>
					{weekday.short}
				</span>
			{/each}
		</div>

		{#each weeks as week, weekIndex (weekIndex)}
			<div class="planner__row" role="row">
				{#each week as day, dayIndex (dayIndex)}
					{#if day === null}
						<span class="planner__cell planner__cell--empty" role="gridcell"></span>
					{:else}
						<button
							class="planner__cell planner__day"
							class:planner__day--selected={selected === iso(viewYear, viewMonth, day)}
							role="gridcell"
							type="button"
							data-day={day}
							disabled={isPast(day)}
							aria-label={labelFor(day)}
							aria-selected={selected === iso(viewYear, viewMonth, day)}
							tabindex={(focusedDay || firstSelectableDay) === day ? 0 : -1}
							onclick={() => select(day)}
							onkeydown={(event) => onKeydown(event, day)}
						>
							{day}
						</button>
					{/if}
				{/each}
			</div>
		{/each}
	</div>

	<div class="planner__legend">
		<span class="planner__legend-item">
			<span class="planner__swatch" aria-hidden="true"></span>
			Beschikbaar
		</span>
		<span class="planner__legend-item">
			<span class="planner__swatch planner__swatch--selected" aria-hidden="true"></span>
			Geselecteerd
		</span>
	</div>

	<div class="planner__cta">
		{#if selected && bookingHref}
			<a class="planner__book" href={bookingHref} rel={calcomLink ? 'noopener' : undefined}>
				Plan 30 minuten op {selectedLabel}
			</a>
		{:else}
			<p class="planner__hint">Kies een dag om je online meeting van 30 minuten te plannen.</p>
		{/if}
	</div>
</div>

<style>
	.planner {
		--tile-bg: color-mix(in srgb, var(--color-bg-sand) 10%, var(--color-fg-forest));
		--tile-bg-hover: color-mix(in srgb, var(--color-bg-sand) 18%, var(--color-fg-forest));

		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		min-height: 26.25rem; /* 420px — matches the form so toggling never shifts layout */
		padding: 1.5rem;
		background: var(--color-fg-forest);
		border-radius: 1.5625rem; /* 25px */
		color: var(--color-bg-sand);
		font-family: var(--font-body);
	}

	.planner__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.planner__month {
		font-family: var(--font-display);
		font-size: 1.5rem; /* 24px */
		font-weight: var(--font-weight-medium);
		line-height: 1.2;
		text-align: center;
	}

	.planner__nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--color-bg-sand);
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover);
	}

	.planner__nav:hover:not(:disabled) {
		background: var(--tile-bg-hover);
		transform: translateY(var(--lift-hover));
	}

	.planner__nav:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	.planner__nav:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.planner__grid {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.planner__row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 0.5rem;
	}

	.planner__weekday {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.125rem;
		font-weight: var(--font-weight-regular);
		color: color-mix(in srgb, var(--color-bg-sand) 80%, transparent);
	}

	.planner__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		min-height: 2.25rem; /* 36px — stays a comfortable target on a 354px card */
		border: 2px solid transparent;
		border-radius: 0.5rem;
		font-family: inherit;
		font-size: 1rem;
		line-height: 1;
	}

	.planner__cell--empty {
		background: transparent;
	}

	.planner__day {
		background: var(--tile-bg);
		color: var(--color-bg-sand);
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	.planner__day:hover:not(:disabled) {
		background: var(--tile-bg-hover);
		transform: translateY(var(--lift-hover));
	}

	.planner__day:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	.planner__day:disabled {
		background: transparent;
		color: color-mix(in srgb, var(--color-bg-sand) 40%, transparent);
		cursor: default;
	}

	.planner__day--selected {
		border-color: var(--color-card-warm);
		background: transparent;
	}

	.planner__legend {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.875rem;
		color: color-mix(in srgb, var(--color-bg-sand) 85%, transparent);
	}

	.planner__legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.planner__swatch {
		width: 1rem;
		height: 1rem;
		border-radius: 0.25rem;
		background: var(--tile-bg);
		border: 2px solid transparent;
	}

	.planner__swatch--selected {
		background: transparent;
		border-color: var(--color-card-warm);
	}

	.planner__cta {
		margin-top: auto;
	}

	.planner__hint {
		font-size: 0.875rem;
		line-height: var(--line-height-normal);
		color: color-mix(in srgb, var(--color-bg-sand) 75%, transparent);
	}

	.planner__book {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 2.5rem;
		padding: 0.5rem 1.5rem;
		border-radius: var(--radius-full);
		background: var(--color-accent-gold-soft);
		color: var(--color-bg-sand);
		font-size: 1rem;
		line-height: 1.2;
		text-align: center;
		text-decoration: none;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			box-shadow var(--motion-hover) var(--ease-hover);
	}

	.planner__book:hover {
		transform: translateY(var(--lift-hover));
		box-shadow: var(--shadow-hover);
	}

	.planner__book:active {
		transform: translateY(0);
		box-shadow: none;
	}

	.planner__book:focus-visible {
		outline: 2px solid var(--color-card-warm);
		outline-offset: 2px;
	}

	@media (min-width: 1024px) {
		.planner {
			min-height: 50rem; /* 800px */
			padding: 2.5rem;
			gap: 1.75rem;
		}

		.planner__month {
			font-size: 2rem;
		}

		.planner__cell {
			min-height: 3rem;
			font-size: 1.125rem;
		}

		.planner__book {
			width: auto;
			align-self: flex-start;
		}
	}
</style>
