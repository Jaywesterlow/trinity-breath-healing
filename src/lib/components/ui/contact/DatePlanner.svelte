<script lang="ts">
	/**
	 * Online-meeting planner — the two states of Figma frame 441-48.
	 *
	 *   1. Default: the month grid plus the Beschikbaar/Geselecteerd legend.
	 *   2. Date picked: the calendar compresses and fades out under a mask, the
	 *      chosen date and its time slots appear, and the confirm button shows up
	 *      disabled until a time is picked.
	 *
	 * Availability comes from $lib/booking/schedule — never from this component.
	 * That is deliberate: when the CMS lands, a load() hands a Schedule in through
	 * the `schedule` prop and nothing here changes.
	 *
	 * Sizing follows Figma's proportions rather than its pixels. The reference
	 * frame is 1440x1024 with an 800px card (424-113), i.e. the card is 78% of the
	 * viewport height — so the 80vh cap is the design's own proportion, and every
	 * size inside it is a clamp anchored to the Figma value at that reference.
	 */
	import { onMount, tick } from 'svelte';
	import { BRAND } from '$lib/constants/brand';
	import {
		bookingSchema,
		emptyBooking,
		toBookingErrors,
		type BookingFieldErrors,
		type BookingInput
	} from '$lib/booking/booking';
	import {
		DEFAULT_SCHEDULE,
		isBookable,
		isoWeekday,
		slotsFor,
		toIso,
		type Schedule,
		type TimeSlot
	} from '$lib/booking/schedule';

	let { schedule = DEFAULT_SCHEDULE }: { schedule?: Schedule } = $props();

	/** Capitalised, as Figma writes them ("Juni 2026", "8 Juni - 2026"). */
	const MONTHS = [
		'Januari',
		'Februari',
		'Maart',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Augustus',
		'September',
		'Oktober',
		'November',
		'December'
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
	 * Server render and first hydration both use the build date so the markup
	 * matches on both sides; onMount swaps in the visitor's real today.
	 */
	const buildToday = new Date(`${__BUILD_DATE__}T00:00:00`);
	let now = $state(buildToday);
	let viewYear = $state(buildToday.getFullYear());
	let viewMonth = $state(buildToday.getMonth());

	/**
	 * The flow, in order. `klaar` is the confirmation the card becomes once the
	 * request is away. Each step's back control is labelled with the step it
	 * returns to, so stepping back from `gegevens` lands on `tijd`, not on the
	 * calendar — two presses to get all the way home, deliberately.
	 */
	type Step = 'datum' | 'tijd' | 'gegevens' | 'klaar';

	const STEP_LABEL: Record<Step, string> = {
		datum: 'Kies datum',
		tijd: 'Kies tijd',
		gegevens: 'Gegevens',
		klaar: 'Bevestiging'
	};
	const PREVIOUS: Partial<Record<Step, Step>> = { tijd: 'datum', gegevens: 'tijd' };

	let step = $state<Step>('datum');
	let selectedDate = $state<string | null>(null);
	let selectedSlot = $state<TimeSlot | null>(null);
	let focusedDay = $state(0); // day number holding the roving tabindex; 0 = none yet

	let details = $state<BookingInput>({ ...emptyBooking, datum: '', start: '', end: '' });
	let errors = $state<BookingFieldErrors>({});
	let sending = $state(false);
	let sendError = $state('');
	let confirmation = $state('');

	onMount(() => {
		const real = new Date();
		if (toIso(real) === toIso(now)) return;
		now = real;
		viewYear = real.getFullYear();
		viewMonth = real.getMonth();
	});

	const today = $derived(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
	const daysInMonth = $derived(new Date(viewYear, viewMonth + 1, 0).getDate());
	const monthLabel = $derived(`${MONTHS[viewMonth]!} ${viewYear}`);

	/** Nothing before today is bookable, so the previous arrow stops at this month. */
	const atFirstMonth = $derived(viewYear === today.getFullYear() && viewMonth === today.getMonth());

	function isoFor(day: number): string {
		return toIso(new Date(viewYear, viewMonth, day));
	}

	const weeks = $derived.by(() => {
		const leading = isoWeekday(new Date(viewYear, viewMonth, 1)) - 1;
		const cells: (number | null)[] = [
			...Array.from({ length: leading }, () => null),
			...Array.from({ length: daysInMonth }, (_, i) => i + 1)
		];
		while (cells.length % 7 !== 0) cells.push(null);
		return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
	});

	/**
	 * One availability pass per month render rather than one per cell, indexed by
	 * day number so the template reads as `bookableDays[day]`.
	 */
	const bookableDays = $derived.by(() => {
		const open: boolean[] = [];
		for (let day = 1; day <= daysInMonth; day++) {
			open[day] = isBookable(schedule, isoFor(day), now);
		}
		return open;
	});

	/** Where the roving tabindex starts before anything is focused. */
	const firstBookableDay = $derived(Math.max(bookableDays.findIndex(Boolean), 1));

	const slots = $derived(selectedDate ? slotsFor(schedule, selectedDate, now) : []);

	const selectedLabel = $derived.by(() => {
		if (!selectedDate) return null;
		const [year, month, day] = selectedDate.split('-').map(Number) as [number, number, number];
		return `${day} ${MONTHS[month - 1]!} - ${year}`;
	});

	/** Spoken form — "8 Juni - 2026" reads badly to a screen reader. */
	function spokenDate(iso: string): string {
		const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
		const date = new Date(year, month - 1, day);
		return `${WEEKDAYS[isoWeekday(date) - 1]!.long} ${day} ${MONTHS[month - 1]!.toLowerCase()} ${year}`;
	}

	function labelFor(day: number): string {
		const iso = isoFor(day);
		return bookableDays[day] ? spokenDate(iso) : `${spokenDate(iso)} — niet beschikbaar`;
	}

	function shiftMonth(delta: number) {
		if (delta < 0 && atFirstMonth) return;
		const next = new Date(viewYear, viewMonth + delta, 1);
		viewYear = next.getFullYear();
		viewMonth = next.getMonth();
		focusedDay = 0;
	}

	async function selectDay(day: number) {
		if (!bookableDays[day]) return;
		selectedDate = isoFor(day);
		selectedSlot = null;
		focusedDay = day;
		step = 'tijd';
		// The calendar shrinks under the mask when the slots appear; keep the day
		// the visitor just chose in view instead of letting it scroll off.
		await tick();
		document
			.querySelector(`[data-day="${day}"]`)
			?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	}

	/** The back control: one step at a time, dropping what that step chose. */
	function goBack() {
		const previous = PREVIOUS[step];
		if (!previous) return;
		if (previous === 'datum') {
			selectedDate = null;
			selectedSlot = null;
		}
		step = previous;
	}

	function toDetails() {
		if (!selectedSlot) return;
		errors = {};
		sendError = '';
		step = 'gegevens';
	}

	const detailsReady = $derived(
		Boolean(details.voornaam?.trim() && details.achternaam?.trim() && details.email?.trim())
	);

	async function book() {
		if (!selectedDate || !selectedSlot || sending) return;

		const payload = {
			...details,
			datum: selectedDate,
			start: selectedSlot.start,
			end: selectedSlot.end
		};
		const parsed = bookingSchema.safeParse(payload);
		if (!parsed.success) {
			errors = toBookingErrors(parsed.error);
			sendError = 'Controleer de gemarkeerde velden en probeer het opnieuw.';
			await tick();
			document.querySelector<HTMLElement>('.planner [aria-invalid="true"]')?.focus();
			return;
		}

		errors = {};
		sending = true;
		sendError = '';

		try {
			const response = await fetch('/api/booking', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify(parsed.data)
			});
			const body = (await response.json().catch(() => ({}))) as {
				ok?: boolean;
				message?: string;
				errors?: BookingFieldErrors;
			};

			if (response.ok && body.ok) {
				confirmation = body.message ?? 'Je aanvraag is verstuurd.';
				step = 'klaar';
				return;
			}

			errors = body.errors ?? {};
			sendError = body.message ?? `Er ging iets mis. Mail gerust naar ${BRAND.email}.`;
		} catch {
			sendError = `Er is geen verbinding. Probeer het later opnieuw of mail naar ${BRAND.email}.`;
		} finally {
			sending = false;
		}
	}

	function restart() {
		step = 'datum';
		selectedDate = null;
		selectedSlot = null;
		details = { ...emptyBooking, datum: '', start: '', end: '' };
		errors = {};
		sendError = '';
		confirmation = '';
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
		else if (event.key === 'Home') target = 1;
		else if (event.key === 'End') target = daysInMonth;
		else return;

		event.preventDefault();
		focusDay(Math.min(Math.max(target, 1), daysInMonth));
	}
</script>

<div class="planner">
	<div class="planner__head">
		<button
			class="planner__nav"
			type="button"
			onclick={() => shiftMonth(-1)}
			disabled={atFirstMonth}
			aria-label="Vorige maand"
		>
			<svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
				<path
					d="M32 20H8M8 20L18 10M8 20L18 30"
					stroke="currentColor"
					stroke-width="2"
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
			<svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
				<path
					d="M8 20H32M32 20L22 10M32 20L22 30"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>

	<div class="planner__calendar" class:planner__calendar--compact={step !== 'datum'}>
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
								class:planner__day--open={bookableDays[day]}
								class:planner__day--selected={selectedDate === isoFor(day)}
								role="gridcell"
								type="button"
								data-day={day}
								aria-disabled={bookableDays[day] ? undefined : 'true'}
								aria-label={labelFor(day)}
								aria-selected={selectedDate === isoFor(day)}
								tabindex={(focusedDay || firstBookableDay) === day ? 0 : -1}
								onclick={() => selectDay(day)}
								onkeydown={(event) => onKeydown(event, day)}
							>
								{day}
							</button>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>

	{#if step === 'datum'}
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
	{:else if step === 'klaar'}
		<div class="planner__done" role="status">
			<p class="planner__date">{selectedLabel}{selectedSlot ? `, ${selectedSlot.start}` : ''}</p>
			<p class="planner__done-text">{confirmation}</p>
		</div>

		<div class="planner__actions">
			<button class="planner__proceed" type="button" onclick={restart}>
				Nog een moment plannen
			</button>
		</div>
	{:else}
		<div class="planner__slots">
			<p class="planner__date">
				{selectedLabel}{step === 'gegevens' && selectedSlot ? `, ${selectedSlot.start}` : ''}
			</p>

			{#if step === 'tijd'}
				{#if slots.length > 0}
					<div
						class="planner__times"
						role="group"
						aria-label="Tijden op {selectedDate ? spokenDate(selectedDate) : ''}"
					>
						{#each slots as slot (slot.start)}
							<button
								class="planner__time"
								class:planner__time--selected={selectedSlot?.start === slot.start}
								type="button"
								aria-pressed={selectedSlot?.start === slot.start}
								onclick={() => (selectedSlot = slot)}
							>
								{slot.label}
							</button>
						{/each}
					</div>
				{:else}
					<p class="planner__empty">Op deze dag zijn geen tijden meer vrij. Kies een andere dag.</p>
				{/if}
			{:else}
				<div class="planner__fields">
					<div class="planner__field-row">
						<div class="planner__field">
							<label class="planner__label" for="booking-voornaam">Voornaam</label>
							<input
								class="planner__input"
								id="booking-voornaam"
								type="text"
								autocomplete="given-name"
								placeholder="John"
								bind:value={details.voornaam}
								aria-invalid={errors.voornaam ? 'true' : undefined}
								aria-describedby={errors.voornaam ? 'booking-voornaam-error' : undefined}
							/>
							{#if errors.voornaam}
								<p class="planner__error" id="booking-voornaam-error">{errors.voornaam}</p>
							{/if}
						</div>

						<div class="planner__field">
							<label class="planner__label" for="booking-achternaam">Achternaam</label>
							<input
								class="planner__input"
								id="booking-achternaam"
								type="text"
								autocomplete="family-name"
								placeholder="Williams"
								bind:value={details.achternaam}
								aria-invalid={errors.achternaam ? 'true' : undefined}
								aria-describedby={errors.achternaam ? 'booking-achternaam-error' : undefined}
							/>
							{#if errors.achternaam}
								<p class="planner__error" id="booking-achternaam-error">{errors.achternaam}</p>
							{/if}
						</div>
					</div>

					<div class="planner__field">
						<label class="planner__label" for="booking-email">Email</label>
						<input
							class="planner__input"
							id="booking-email"
							type="email"
							inputmode="email"
							autocomplete="email"
							placeholder="voorbeeld@email.com"
							bind:value={details.email}
							aria-invalid={errors.email ? 'true' : undefined}
							aria-describedby={errors.email ? 'booking-email-error' : undefined}
						/>
						{#if errors.email}
							<p class="planner__error" id="booking-email-error">{errors.email}</p>
						{/if}
					</div>

					<div class="planner__field">
						<label class="planner__label" for="booking-klachten">
							Waar loop je tegenaan? <span class="planner__optional">(optioneel)</span>
						</label>
						<textarea
							class="planner__input planner__input--area"
							id="booking-klachten"
							rows="2"
							placeholder="Kort in je eigen woorden"
							bind:value={details.klachten}
							aria-invalid={errors.klachten ? 'true' : undefined}
							aria-describedby={errors.klachten ? 'booking-klachten-error' : undefined}></textarea>
						{#if errors.klachten}
							<p class="planner__error" id="booking-klachten-error">{errors.klachten}</p>
						{/if}
					</div>

					<!-- Honeypot: off-screen, never announced, never tabbed into. -->
					<div class="planner__honeypot" aria-hidden="true">
						<label for="booking-website">Laat dit veld leeg</label>
						<input
							id="booking-website"
							type="text"
							tabindex="-1"
							autocomplete="off"
							bind:value={details.website}
						/>
					</div>
				</div>
			{/if}

			{#if sendError}
				<p class="planner__error planner__error--form" role="alert">{sendError}</p>
			{/if}
		</div>

		<div class="planner__actions">
			<button class="planner__back" type="button" onclick={goBack}>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M15 5L8 12L15 19"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				{STEP_LABEL[PREVIOUS[step]!]}
			</button>

			{#if step === 'tijd'}
				<button class="planner__proceed" type="button" disabled={!selectedSlot} onclick={toDetails}>
					Gegevens invullen
				</button>
			{:else}
				<button
					class="planner__proceed"
					type="button"
					disabled={!detailsReady || sending}
					onclick={book}
				>
					{sending ? 'Versturen…' : 'Boek een gesprek'}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.planner {
		/* Figma 441-48 fills: the tile green is rgb(122 140 110) at three alphas —
		   0.1 unavailable, 0.6 available, 0.75 selected. It is kept as a local
		   token rather than --brand-muted, which was darkened for WCAG contrast
		   and no longer matches the design's green. */
		--pl-tile: 122 140 110;
		--pl-ink: #faf0e6;
		--pl-radius: 0.625rem; /* 10px */
		--pl-gap-y: clamp(0.375rem, 1.1vh, 0.6875rem); /* 11px at the reference frame */

		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 2vh, 1.75rem);
		width: 100%;
		min-height: 26.25rem; /* 420px — matches the form so toggling never shifts layout */
		/* Both ends stay on screen: the calendar gives up height (and fades under
		   its mask) rather than letting the card run past the viewport. */
		max-height: 85vh;
		padding: clamp(1rem, 4.8%, 1.75rem); /* 28px at 588px wide */
		background: var(--color-fg-forest);
		border-radius: 1.5625rem; /* 25px */
		color: var(--pl-ink);
		font-family: var(--font-body);
	}

	/* ─── Month header ─── */
	.planner__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0 0.75rem; /* 12px, per Figma 441:153 */
		flex-shrink: 0;
	}

	.planner__month {
		font-size: clamp(1.25rem, 4.4vh, 2.5rem); /* 40px */
		font-weight: var(--font-weight-medium);
		line-height: 1.2;
		text-align: center;
	}

	.planner__nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: clamp(1.75rem, 4.4vh, 2.5rem); /* 40px */
		height: clamp(1.75rem, 4.4vh, 2.5rem);
		padding: 0;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--pl-ink);
		cursor: pointer;
		flex-shrink: 0;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			opacity var(--motion-hover) var(--ease-hover);
	}

	.planner__nav svg {
		width: 100%;
		height: 100%;
	}

	.planner__nav:hover:not(:disabled) {
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

	/* ─── Calendar ─── */
	.planner__calendar {
		/* Takes its natural height and gives room back when the card is short —
		   the overflow then scrolls inside rather than pushing the button off. */
		flex: 0 1 auto;
		min-height: 0;
		overflow-y: auto;
		scrollbar-width: none;
	}

	.planner__calendar::-webkit-scrollbar {
		display: none;
	}

	/* State 2: the grid gives up its room to the slots and fades out under them,
	   exactly as the design draws it. Still scrollable, so a date further down
	   the month stays reachable without leaving the state. */
	.planner__calendar--compact {
		-webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
		mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
	}

	.planner__grid {
		display: flex;
		flex-direction: column;
		gap: var(--pl-gap-y);
	}

	.planner__row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		/* 11px across a 486px grid — a ratio, so the columns keep Figma's rhythm
		   at any card width. */
		column-gap: 2.26%;
	}

	.planner__row--head {
		padding-bottom: clamp(0.5rem, 1.8vh, 1.5625rem); /* 25px */
		flex-shrink: 0;
	}

	.planner__weekday {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(0.875rem, 2.4vh, 1.5rem); /* 24px */
		font-weight: var(--font-weight-regular);
		color: rgb(250 240 230 / 0.7);
	}

	.planner__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		/* Column width reproduces Figma's 60px-in-486px tile exactly, because the
		   2.26% column gap is that same ratio. The vh cap only bites on a short
		   viewport, where a square-by-width tile would be taller than the card. */
		width: min(100%, 8vh);
		justify-self: center;
		border: 2px solid transparent;
		border-radius: var(--pl-radius);
		font-family: inherit;
		font-size: clamp(0.8125rem, 2vh, 1.25rem); /* 20px */
		line-height: 1;
	}

	.planner__cell--empty {
		background: transparent;
	}

	.planner__grid .planner__row:not(.planner__row--head) {
		flex: 0 0 auto;
	}

	.planner__day {
		background: rgb(var(--pl-tile) / 0.1);
		color: #fff;
		opacity: 0.35;
		cursor: default;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover),
			opacity var(--motion-hover) var(--ease-hover);
	}

	.planner__day--open {
		background: rgb(var(--pl-tile) / 0.6);
		cursor: pointer;
	}

	.planner__day--open:hover {
		opacity: 0.6;
		transform: translateY(var(--lift-hover));
	}

	.planner__day[aria-disabled='true'] {
		cursor: default;
	}

	.planner__day:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	.planner__day--selected,
	.planner__day--open.planner__day--selected {
		background: rgb(var(--pl-tile) / 0.75);
		border-color: var(--pl-ink);
		color: var(--pl-ink);
		opacity: 1;
	}

	/* ─── Legend (state 1 only) ─── */
	.planner__legend {
		margin-top: auto;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: clamp(1rem, 2.9vh, 1.8125rem); /* 29px */
		flex-shrink: 0;
		font-size: clamp(0.875rem, 2vh, 1.25rem); /* 20px */
	}

	.planner__legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem; /* 8px */
		padding: 0.5rem;
	}

	.planner__swatch {
		width: 1.25rem; /* 20px */
		height: 1.25rem;
		border-radius: 0.3125rem; /* 5px */
		background: rgb(var(--pl-tile) / 0.6);
		border: 2px solid transparent;
		opacity: 0.35;
	}

	.planner__swatch--selected {
		background: rgb(var(--pl-tile) / 0.75);
		border-color: var(--pl-ink);
		opacity: 1;
	}

	/* ─── Slots (state 2) ─── */
	.planner__slots {
		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 1.6vh, 1.25rem);
		flex-shrink: 0;
	}

	.planner__date {
		font-size: clamp(0.9375rem, 2vh, 1.25rem); /* 20px */
		font-weight: 600; /* DM Sans SemiBold */
		line-height: 1.2;
	}

	.planner__times {
		display: grid;
		/* Figma draws four columns on desktop, and has no mobile frame for this
		   state. auto-fit keeps the tile's own width as the unit, so the grid
		   lands on four columns at the reference width and drops to three or two
		   on a phone instead of pushing the last column out of the card. */
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 6.5rem), 1fr));
		column-gap: 1.64%; /* 8px across the 488px grid */
		row-gap: clamp(0.375rem, 1.2vh, 0.75rem); /* 12px */
	}

	.planner__time {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: clamp(1.75rem, 3.7vh, 2.3125rem); /* 37px */
		padding: 0.5rem; /* 8px */
		border: 2px solid transparent;
		border-radius: var(--pl-radius);
		background: rgb(var(--pl-tile) / 0.6);
		color: var(--pl-ink);
		font-family: inherit;
		font-size: clamp(0.6875rem, 1.6vh, 1rem); /* 16px */
		font-weight: var(--font-weight-medium);
		line-height: 1;
		white-space: nowrap;
		opacity: 0.35;
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			opacity var(--motion-hover) var(--ease-hover);
	}

	.planner__time:hover {
		opacity: 0.6;
		transform: translateY(var(--lift-hover));
	}

	.planner__time:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	.planner__time--selected {
		background: rgb(var(--pl-tile) / 0.75);
		border-color: var(--pl-ink);
		opacity: 1;
	}

	.planner__empty {
		font-size: clamp(0.8125rem, 1.7vh, 1rem);
		line-height: var(--line-height-normal);
		color: rgb(250 240 230 / 0.75);
	}

	/* ─── Actions (state 2) ─── */
	.planner__actions {
		margin-top: auto;
		flex-wrap: wrap;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-shrink: 0;
	}

	.planner__proceed {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: clamp(2.125rem, 4vh, 2.5rem); /* 40px */
		padding: 0.5rem 1.5rem; /* 8px / 24px */
		border: none;
		border-radius: 2.8125rem; /* 45px */
		background: var(--color-accent-gold-soft); /* #c7a27a */
		color: var(--pl-ink);
		font-family: inherit;
		font-size: clamp(0.8125rem, 1.6vh, 1rem); /* 16px */
		font-weight: var(--font-weight-medium);
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			box-shadow var(--motion-hover) var(--ease-hover),
			opacity var(--motion-hover) var(--ease-hover);
	}

	.planner__proceed:hover:not(:disabled) {
		transform: translateY(var(--lift-hover));
		box-shadow: var(--shadow-hover);
	}

	.planner__proceed:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}

	.planner__proceed:focus-visible {
		outline: 2px solid var(--color-card-warm);
		outline-offset: 2px;
	}

	/* Figma draws only the enabled pill. Disabled reuses it at the same opacity
	   the design uses for "not your turn yet" tiles, so the two read as one
	   system — flagged as a design decision, not an invention. */
	.planner__proceed:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	/* Back: a chevron plus the name of the step it returns to, so "where does
	   this take me" never has to be guessed. The label changes with the step. */
	.planner__back {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		min-height: clamp(2.125rem, 4vh, 2.5rem);
		padding: 0.5rem 0.75rem 0.5rem 0.5rem;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--pl-ink);
		font-family: inherit;
		font-size: clamp(0.75rem, 1.6vh, 1rem);
		font-weight: var(--font-weight-medium);
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover);
	}

	.planner__back svg {
		width: 1.25em;
		height: 1.25em;
		flex-shrink: 0;
	}

	.planner__back:hover {
		background: rgb(var(--pl-tile) / 0.35);
		transform: translateY(var(--lift-hover));
	}

	.planner__back:active {
		transform: translateY(0);
	}

	.planner__back:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	/* ─── Details (step 3) ─── */
	.planner__fields {
		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 1.4vh, 1rem);
	}

	.planner__field-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
		gap: clamp(0.5rem, 1.4vh, 1rem);
	}

	.planner__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.planner__label {
		font-size: clamp(0.75rem, 1.6vh, 1rem);
		line-height: 1.2;
	}

	.planner__optional {
		color: rgb(250 240 230 / 0.65);
	}

	.planner__input {
		width: 100%;
		min-height: clamp(2rem, 4.4vh, 2.75rem);
		padding: 0.5rem 0.75rem;
		background: rgb(var(--pl-tile) / 0.35);
		border: 2px solid transparent;
		border-radius: var(--pl-radius);
		color: var(--pl-ink);
		font-family: inherit;
		font-size: clamp(0.75rem, 1.6vh, 1rem);
		line-height: var(--line-height-normal);
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			border-color var(--motion-hover) var(--ease-hover);
	}

	.planner__input::placeholder {
		color: rgb(250 240 230 / 0.45);
	}

	.planner__input:hover {
		background: rgb(var(--pl-tile) / 0.5);
	}

	.planner__input:focus-visible {
		outline: none;
		border-color: var(--pl-ink);
		background: rgb(var(--pl-tile) / 0.5);
	}

	.planner__input[aria-invalid='true'] {
		border-color: var(--color-accent-gold);
	}

	.planner__input--area {
		resize: vertical;
	}

	.planner__error {
		font-size: clamp(0.6875rem, 1.4vh, 0.8125rem);
		line-height: var(--line-height-normal);
		color: var(--color-accent-gold);
	}

	.planner__error--form {
		margin-top: 0.25rem;
	}

	.planner__honeypot {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	/* ─── Confirmation ─── */
	.planner__done {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.planner__done-text {
		font-size: clamp(0.8125rem, 1.7vh, 1rem);
		line-height: var(--line-height-normal);
		color: rgb(250 240 230 / 0.85);
	}

	/* Below the desktop breakpoint the card is narrow, so the month title has to
	   be sized by width — a vh-driven size wraps it onto two lines on a phone. */
	@media (max-width: 1023px) {
		.planner__month {
			font-size: clamp(1.125rem, 6vw, 1.75rem);
		}
	}

	@media (min-width: 1024px) {
		/* The reference frame puts an 800px card in 1024px of viewport — 78%.
		   The cap is that proportion, not an arbitrary limit. */
		.planner {
			height: min(80vh, 50rem);
			min-height: 0;
		}
	}
</style>
