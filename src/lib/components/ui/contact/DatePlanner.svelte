<script lang="ts">
	/**
	 * Online-meeting planner — datum, tijd, gegevens, klaar.
	 *
	 * The card is a fixed frame: a stage in the middle that swaps one step for
	 * the next, and a footer under it that never moves. Steps do not stack or
	 * push each other — the outgoing one slides left and fades, the incoming one
	 * arrives from the right once it has gone, so nothing is ever obscured and
	 * the footer controls stay exactly where the pointer left them.
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
	import { fly, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
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
		firstBookableDate,
		fromIso,
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

	/**
	 * The month the calendar opens on: the one holding the first date the
	 * schedule actually offers, not simply the current one. Those are usually
	 * the same month and occasionally are not — late on the last evening of a
	 * month, every remaining slot is inside the 24-hour lead time — and when
	 * they differ, opening on the current month shows an empty grid with the
	 * back arrow disabled and no hint that the answer is one click forward.
	 */
	function openingMonth(reference: Date): { year: number; month: number } {
		const first = firstBookableDate(DEFAULT_SCHEDULE, reference);
		const date = first ? fromIso(first) : reference;
		return { year: date.getFullYear(), month: date.getMonth() };
	}

	const opening = openingMonth(buildToday);
	let viewYear = $state(opening.year);
	let viewMonth = $state(opening.month);
	/** The month the back arrow stops at — never earlier than what is bookable. */
	let firstMonth = $state(opening);

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
	/* What the slide transition keys on. 'datum' and 'tijd' share one stage so
	   the calendar stays put while the time panel rises over it — keying on
	   `step` itself tore the calendar down and rebuilt it on that hop, which is
	   the opposite of what the design does. */
	const stage = $derived(step === 'datum' || step === 'tijd' ? 'kalender' : step);
	/* Three dashes and "Stap n van 3". `klaar` is the confirmation, past the end. */
	const STEP_INDEX: Record<Step, number> = { datum: 1, tijd: 2, gegevens: 3, klaar: 3 };
	/** 1 = moving forward through the flow, -1 = going back. Drives which way
	 *  the steps slide, so back genuinely looks like back. */
	let direction = $state(1);
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
		const fresh = openingMonth(real);
		firstMonth = fresh;
		viewYear = fresh.year;
		viewMonth = fresh.month;
	});

	const daysInMonth = $derived(new Date(viewYear, viewMonth + 1, 0).getDate());
	const monthLabel = $derived(`${MONTHS[viewMonth]!} ${viewYear}`);

	/** Nothing before the first bookable date is reachable, so the previous arrow
	 *  stops at its month rather than at today's. */
	const atFirstMonth = $derived(viewYear === firstMonth.year && viewMonth === firstMonth.month);

	function isoFor(day: number): string {
		return toIso(new Date(viewYear, viewMonth, day));
	}

	/**
	 * Always six rows, padded with blanks. A month that needs five would
	 * otherwise render a shorter grid, and every month change would jolt the
	 * header and footer up and down by a row.
	 */
	const WEEK_ROWS = 6;
	const weeks = $derived.by(() => {
		const leading = isoWeekday(new Date(viewYear, viewMonth, 1)) - 1;
		const cells: (number | null)[] = [
			...Array.from({ length: leading }, () => null),
			...Array.from({ length: daysInMonth }, (_, i) => i + 1)
		];
		while (cells.length < WEEK_ROWS * 7) cells.push(null);
		return Array.from({ length: WEEK_ROWS }, (_, w) => cells.slice(w * 7, w * 7 + 7));
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

	/**
	 * Slots already claimed by someone else, keyed "YYYY-MM-DD HH:MM".
	 *
	 * Fetched rather than rendered: the landing page is prerendered, so
	 * availability baked in at build time would be a snapshot from deploy day.
	 * Starts empty and stays empty if the request fails — every slot stays
	 * offered, and the server remains the only thing that can actually refuse
	 * one. Failing the other way would show a fully booked calendar because of
	 * a network blip.
	 */
	let taken = $state(new Set<string>());

	async function loadAvailability() {
		const first = isoFor(1);
		const last = isoFor(daysInMonth);
		try {
			const response = await fetch(`/api/availability?from=${first}&to=${last}`);
			if (!response.ok) return;
			const payload = (await response.json()) as { taken?: { datum: string; start: string }[] };
			taken = new Set((payload.taken ?? []).map((s) => `${s.datum} ${s.start}`));
		} catch {
			/* Offline or blocked — leave the calendar as the schedule describes it. */
		}
	}

	$effect(() => {
		/* Re-read on every month change; touching both is what subscribes this
		   effect to them. */
		void viewYear;
		void viewMonth;
		void loadAvailability();
	});

	const slots = $derived(
		selectedDate
			? slotsFor(schedule, selectedDate, now).map((slot) => ({
					...slot,
					taken: taken.has(`${selectedDate} ${slot.start}`)
				}))
			: []
	);

	/** A day with slots, but all of them spoken for, is not selectable. */
	const freeSlotCount = $derived(slots.filter((slot) => !slot.taken).length);

	const selectedLabel = $derived.by(() => {
		if (!selectedDate) return null;
		const [year, month, day] = selectedDate.split('-').map(Number) as [number, number, number];
		return `${day} ${MONTHS[month - 1]!} - ${year}`;
	});

	/* The sheet's own heading: "Vrijdag 11 september — 19.00 tot 21.00 uur". The
	   window comes from the day's real slots rather than a constant, so a day
	   with different hours says so. */
	const sheetLabel = $derived.by(() => {
		if (!selectedDate) return '';
		const [year, month, day] = selectedDate.split('-').map(Number) as [number, number, number];
		const spoken = WEEKDAYS[isoWeekday(new Date(year, month - 1, day)) - 1]!.long;
		const weekday = spoken.charAt(0).toUpperCase() + spoken.slice(1);
		const named = `${weekday} ${day} ${MONTHS[month - 1]!.toLowerCase()}`;
		if (slots.length === 0) return named;
		const from = slots[0]!.start.replace(':', '.');
		const until = slots[slots.length - 1]!.end.replace(':', '.');
		return `${named} — ${from} tot ${until} uur`;
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

	function selectDay(day: number) {
		if (!bookableDays[day]) return;
		selectedDate = isoFor(day);
		selectedSlot = null;
		focusedDay = day;
		direction = 1;
		step = 'tijd';
	}

	/** The back control: one step at a time, dropping what that step chose. */
	function goBack() {
		const previous = PREVIOUS[step];
		if (!previous) return;
		if (previous === 'datum') {
			selectedDate = null;
			selectedSlot = null;
		}
		direction = -1;
		step = previous;
	}

	function toDetails() {
		if (!selectedSlot) return;
		errors = {};
		sendError = '';
		direction = 1;
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
				direction = 1;
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
		direction = -1;
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

	/**
	 * Sequential crossfade: the outgoing step leaves first, the incoming one
	 * waits for it. Overlapping them would put two panels on top of each other,
	 * which is the thing this replaced.
	 */
	const OUT_MS = 160;
	const IN_MS = 300;
	const SLIDE = 40;
	/* The time sheet's rise. Reads the same reduced-motion gate the step slide
	   does, so it appears rather than travels when movement is off. */
	const sheetMs = $derived(motionless() ? 0 : 260);

	function motionless(): boolean {
		return (
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
		);
	}

	function stepIn(node: Element) {
		const still = motionless();
		return fly(node, {
			x: still ? 0 : direction * SLIDE,
			duration: still ? 0 : IN_MS,
			delay: still ? 0 : OUT_MS,
			easing: cubicOut
		});
	}

	function stepOut(node: Element) {
		const still = motionless();
		return fly(node, {
			x: still ? 0 : direction * -SLIDE,
			duration: still ? 0 : OUT_MS,
			easing: cubicOut
		});
	}
</script>

<div class="planner">
	<!-- Three dashes and the step's name, above everything and unchanged between
	     steps: the one part of the card that tells you where you are. -->
	{#if step !== 'klaar'}
		<div class="planner__steps">
			<span class="planner__dashes" aria-hidden="true">
				{#each [1, 2, 3] as n (n)}
					<span class="planner__dash" class:planner__dash--done={n <= STEP_INDEX[step]}></span>
				{/each}
			</span>
			<span class="planner__steps-label">Stap {STEP_INDEX[step]} van 3</span>
		</div>
	{/if}

	<div class="planner__stage">
		{#key stage}
			<div class="planner__step" in:stepIn out:stepOut>
				{#if step === 'datum' || step === 'tijd'}
					<div class="planner__head">
						<button
							class="planner__nav"
							type="button"
							onclick={() => shiftMonth(-1)}
							disabled={atFirstMonth}
							aria-label="Vorige maand"
						>
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M15 5L8 12L15 19"
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
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M9 5L16 12L9 19"
									stroke="currentColor"
									stroke-width="2"
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
				{:else if step === 'klaar'}
					<div class="planner__done" role="status">
						<p class="planner__date">
							{selectedLabel}{selectedSlot ? `, ${selectedSlot.start}` : ''}
						</p>
						<p class="planner__done-text">{confirmation}</p>
					</div>
				{:else}
					<p class="planner__date">
						{selectedLabel}{selectedSlot ? `, ${selectedSlot.start}` : ''}
					</p>
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

						<div class="planner__field planner__field--grow">
							<label class="planner__label" for="booking-klachten">
								Waar loop je tegenaan? <span class="planner__optional">(optioneel)</span>
							</label>
							<textarea
								class="planner__input planner__input--area"
								id="booking-klachten"
								placeholder="Kort in je eigen woorden"
								bind:value={details.klachten}
								aria-invalid={errors.klachten ? 'true' : undefined}
								aria-describedby={errors.klachten ? 'booking-klachten-error' : undefined}
							></textarea>
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

					{#if sendError}
						<p class="planner__error planner__error--form" role="alert">{sendError}</p>
					{/if}
				{/if}
			</div>
		{/key}

		<!-- Step 2 arrives over the calendar rather than replacing it: the day you
		     just picked stays visible above the times you are choosing between.
		     Clicking a time is the way forward — there is no Volgende button. -->
		{#if step === 'tijd'}
			<div class="planner__sheet" transition:slide={{ duration: sheetMs, easing: cubicOut }}>
				<span class="planner__grabber" aria-hidden="true"></span>
				<p class="planner__sheet-date">{sheetLabel}</p>
				{#if slots.length > 0 && freeSlotCount > 0}
					<div
						class="planner__times"
						role="group"
						aria-label="Tijden op {selectedDate ? spokenDate(selectedDate) : ''}"
					>
						{#each slots as slot (slot.start)}
							<button
								class="planner__time"
								class:planner__time--selected={selectedSlot?.start === slot.start}
								class:planner__time--taken={slot.taken}
								type="button"
								aria-pressed={selectedSlot?.start === slot.start}
								aria-disabled={slot.taken ? 'true' : undefined}
								aria-label={slot.taken ? `${slot.label} — al bezet` : slot.label}
								onclick={() => {
									/* aria-disabled rather than disabled: a disabled button
									   drops out of the tab order, so someone arriving by
									   keyboard would skip silently past the taken slots
									   instead of hearing that they are taken. */
									if (slot.taken) return;
									selectedSlot = slot;
									toDetails();
								}}
							>
								<!-- The start time alone. The full range is still what a
								     screen reader hears, via aria-label below. -->
								{slot.start}
							</button>
						{/each}
					</div>
				{:else}
					<p class="planner__empty">
						Op deze dag zijn geen tijden meer vrij. Kies een andere dag.
					</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- The footer never moves between steps: only what sits in it changes. -->
	<div class="planner__footer">
		{#if step === 'datum'}
			<div class="planner__legend">
				<span class="planner__legend-item">
					<span class="planner__swatch" aria-hidden="true"></span>
					Beschikbaar
				</span>
				<span class="planner__legend-item">
					<span class="planner__swatch planner__swatch--closed" aria-hidden="true"></span>
					Niet beschikbaar
				</span>
			</div>
		{:else if step === 'klaar'}
			<button class="planner__proceed" type="button" onclick={restart}>
				Nog een moment plannen
			</button>
		{:else}
			<!-- Text, not an icon button. Forward is never a button in this flow —
			     picking a date is step 1's forward, picking a time is step 2's —
			     so the only control that has to look like a control is Verzenden. -->
			<button
				class="planner__back"
				type="button"
				onclick={goBack}
				aria-label="Terug naar {STEP_LABEL[PREVIOUS[step]!].toLowerCase()}"
			>
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path
						d="M15 5L8 12L15 19"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				Vorige
			</button>

			{#if step === 'gegevens'}
				<button
					class="planner__proceed"
					type="button"
					disabled={!detailsReady || sending}
					onclick={book}
				>
					{sending ? 'Versturen…' : 'Verzenden'}
				</button>
			{/if}
		{/if}
	</div>
</div>

<style>
	.planner {
		/* Figma 441-48 fills: the tile green is rgb(122 140 110) at three alphas —
		   unavailable, available, selected. Kept local rather than --brand-muted,
		   which was darkened for WCAG and no longer matches the design's green. */
		--pl-tile: 122 140 110;
		--pl-ink: #faf0e6;
		--pl-radius: 0.625rem; /* 10px */
		--pl-gap: 0.375rem;
		/* The calendar follows the card's width at every size; only the height cap
		   below narrows it, and only on a short viewport. */
		--pl-measure: 100%;

		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 1.3vh, 1rem);
		width: 100%;
		min-height: 0; /* the wrapper sets the height; this just fills its cell */
		padding: clamp(1rem, 4.5%, 1.75rem);
		background: var(--color-fg-forest);
		border-radius: 1.5625rem; /* 25px */
		color: var(--pl-ink);
		font-family: var(--font-body);
		/* Nothing here scrolls. Every step is sized to fit the card; content that
		   exceeds it is a sizing bug to fix, never a scrollbar to add. */
		overflow: hidden;
	}

	/* ─── Stage: one step at a time, in a box that never changes size ─── */
	.planner__stage {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
	}

	/* ─── Stepper ─── */
	.planner__steps {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		margin-bottom: var(--space-4);
		flex-shrink: 0;
	}

	.planner__dashes {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}

	.planner__dash {
		width: 1.625rem; /* 26px */
		height: 3px;
		border-radius: 2px;
		background: rgb(var(--pl-tile) / 0.45);
		transition: background-color var(--motion-base) var(--ease-out);
	}

	.planner__dash--done {
		background: var(--pl-ink);
	}

	.planner__steps-label {
		font-family: var(--font-body);
		font-size: 0.8125rem; /* 13px */
		font-weight: var(--font-weight-light);
		color: var(--pl-ink);
		margin-left: 0.25rem;
	}

	/* ─── The time sheet ─── */
	/* Rises from the bottom of the card and covers only as much of the calendar
	   as it needs, so the day you just chose stays in view above it. */
	.planner__sheet {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.75rem clamp(0.75rem, 2.5vw, 1.25rem) clamp(0.75rem, 2vh, 1rem);
		border-radius: 1rem 1rem 0 0;
		background: var(--color-card-warm);
		color: var(--color-fg-forest);
	}

	.planner__sheet-date {
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-forest);
		margin: 0 0 0.25rem;
	}

	/* Two across, as the design lays them out — not as many as fit. */
	.planner__sheet .planner__times {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.625rem;
	}

	.planner__sheet .planner__time {
		min-height: 2.75rem;
		background: transparent;
		border-color: color-mix(in srgb, var(--brand-border) 35%, transparent);
		color: var(--color-fg-forest);
		font-size: 0.9375rem;
	}

	.planner__sheet .planner__time--selected {
		background: var(--brand-border);
		border-color: var(--brand-border);
		color: var(--pl-ink);
	}

	.planner__grabber {
		width: 2.375rem;
		height: 4px;
		border-radius: 2px;
		background: color-mix(in srgb, var(--brand-border) 35%, transparent);
		align-self: center;
		margin-bottom: 0.25rem;
	}

	.planner__step {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: clamp(0.375rem, 1.1vh, 0.75rem);
		width: var(--pl-measure);
		margin-inline: auto;
	}

	/* ─── Month header ─── */
	.planner__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.planner__month {
		font-size: clamp(1.125rem, 3.1vh, 1.875rem);
		font-weight: var(--font-weight-medium);
		line-height: 1.2;
		text-align: center;
	}

	.planner__nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: clamp(1.5rem, 3.1vh, 1.875rem);
		height: clamp(1.5rem, 3.1vh, 1.875rem);
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
	.planner__grid {
		display: flex;
		flex-direction: column;
		/* Never stretch: the tiles are square and sized by column width, so a
		   stretched grid just holds the spare height inside itself as a hole
		   under the last week. Let the step centre it instead. */
		flex: 0 0 auto;
		gap: var(--pl-gap);
		width: min(100%, 62vh);
		margin-inline: auto;
	}

	.planner__row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		column-gap: var(--pl-gap);
	}

	/* Six rows are always rendered, so a five-row month cannot pull the header
	   and footer upward when the visitor pages through the calendar. */
	.planner__grid .planner__row:not(.planner__row--head) {
		flex: 0 0 auto;
	}

	.planner__row--head {
		flex: 0 0 auto;
		padding-bottom: clamp(0.25rem, 0.9vh, 0.5rem);
	}

	.planner__weekday {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(0.75rem, 1.7vh, 1rem);
		font-weight: var(--font-weight-regular);
		color: rgb(250 240 230 / 0.7);
	}

	.planner__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		width: 100%;
		border: 2px solid transparent;
		border-radius: var(--pl-radius);
		font-family: inherit;
		font-size: clamp(0.6875rem, 1.5vh, 1rem);
		line-height: 1;
	}

	.planner__cell--empty {
		background: transparent;
	}

	/* Unavailable takes the fill that used to mean "available": the old 0.1 alpha
	   was so dark against the card it read as a hole rather than a day. */
	.planner__day {
		background: rgb(var(--pl-tile) / 0.6);
		color: #fff;
		opacity: 0.35;
		cursor: default;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover),
			opacity var(--motion-hover) var(--ease-hover);
	}

	.planner__day[aria-disabled='true'] {
		cursor: default;
	}

	/* Available is not dimmed at all — a control you can press should not look
	   like one you cannot, and at 35% the numbers were barely legible. */
	.planner__day--open {
		background: rgb(var(--pl-tile) / 0.65);
		opacity: 1;
		cursor: pointer;
	}

	.planner__day--open:hover {
		background: rgb(var(--pl-tile) / 0.8);
		transform: translateY(var(--lift-hover));
	}

	.planner__day:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	.planner__day--selected,
	/* A filled brown circle, as the design draws it — the outlined square read as
	   a focus ring rather than a choice. */
	.planner__day--open.planner__day--selected {
		background: var(--brand-border);
		border-color: var(--brand-border);
		border-radius: var(--radius-full);
		color: var(--pl-ink);
		opacity: 1;
	}

	/* ─── Footer: fixed height, so its controls never move between steps ─── */
	.planner__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-shrink: 0;
		min-height: clamp(1.875rem, 3.3vh, 2.25rem);
		width: var(--pl-measure);
		margin-inline: auto;
	}

	.planner__legend {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		width: 100%;
		gap: clamp(0.75rem, 2.2vh, 1.5rem);
		font-size: clamp(0.75rem, 1.5vh, 0.9375rem);
	}

	.planner__legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.planner__swatch {
		width: 1rem;
		height: 1rem;
		border-radius: 0.3125rem;
		background: rgb(var(--pl-tile) / 0.65);
	}

	/* Reads exactly as an unavailable tile does, because that is what it labels. */
	.planner__swatch--closed {
		background: rgb(var(--pl-tile) / 0.6);
		opacity: 0.35;
	}

	/* ─── Slots ─── */
	.planner__date {
		font-size: clamp(0.8125rem, 1.6vh, 1rem);
		font-weight: 600; /* DM Sans SemiBold */
		line-height: 1.2;
		flex-shrink: 0;
	}

	.planner__times {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 4.75rem), 1fr));
		gap: var(--pl-gap);
		flex: 0 1 auto;
		min-height: 0;
		align-content: start;
	}

	.planner__time {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: clamp(1.5rem, 2.9vh, 1.875rem);
		padding: 0.375rem 0.25rem;
		border: 2px solid transparent;
		border-radius: var(--pl-radius);
		background: rgb(var(--pl-tile) / 0.65);
		color: var(--pl-ink);
		font-family: inherit;
		font-size: clamp(0.625rem, 1.35vh, 0.875rem);
		font-weight: var(--font-weight-medium);
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover);
	}

	.planner__time:hover {
		background: rgb(var(--pl-tile) / 0.8);
		transform: translateY(var(--lift-hover));
	}

	.planner__time:focus-visible {
		outline: 2px solid var(--color-accent-gold-soft);
		outline-offset: 2px;
	}

	.planner__time--selected {
		background: rgb(var(--pl-tile) / 0.75);
		border-color: var(--pl-ink);
	}

	/* Someone else already asked for this one. Struck through as well as
	   dimmed: opacity alone reads as "loading" or as a rendering glitch, and
	   the line makes the state unambiguous without adding a legend. */
	.planner__time--taken {
		opacity: 0.4;
		text-decoration: line-through;
		cursor: not-allowed;
	}

	.planner__time--taken:hover {
		/* Cancel the lift — a tile that rises to meet the cursor promises a
		   click that will not happen. */
		transform: none;
	}

	.planner__empty {
		font-size: clamp(0.8125rem, 1.7vh, 1rem);
		line-height: var(--line-height-normal);
		color: rgb(250 240 230 / 0.75);
	}

	/* ─── Details ─── */
	/* Sized by its own content, not by the card: the card is as tall as the
	   calendar needs and the step centres what it holds, so a stretching fields
	   block would just pin the form to the top with a hole under it. */
	.planner__fields {
		display: flex;
		flex-direction: column;
		flex: 0 0 auto;
		min-height: 0;
		gap: clamp(0.375rem, 1.1vh, 0.75rem);
	}

	.planner__field-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
		gap: clamp(0.375rem, 1.1vh, 0.75rem);
	}

	.planner__field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	/* Grows into what the step has spare, but no further than the textarea's own
	   cap — the taller card would otherwise make this field the whole step. */
	.planner__field--grow {
		flex: 0 1 auto;
		min-height: 0;
	}

	.planner__label {
		font-size: clamp(0.75rem, 1.5vh, 0.9375rem);
		line-height: 1.2;
	}

	.planner__optional {
		color: rgb(250 240 230 / 0.65);
	}

	/* The card gained height for the calendar, and .planner__field--grow handed
	   all of it to this one control — a textarea taller than the rest of the
	   step put together. It gets a working size and the step keeps the slack. */
	.planner__input--area {
		max-height: 9rem;
		resize: vertical;
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
		font-size: clamp(0.75rem, 1.5vh, 0.9375rem);
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

	/* No drag handle, for the same reason as the e-mail form: dragging it grew
	   the field past the card and took the footer with it. */
	.planner__input--area {
		flex: 1 1 auto;
		min-height: clamp(2.5rem, 6vh, 5rem);
		resize: none;
		overflow-y: auto;
	}

	.planner__error {
		font-size: clamp(0.6875rem, 1.4vh, 0.8125rem);
		line-height: var(--line-height-normal);
		color: var(--color-accent-gold);
	}

	.planner__error--form {
		flex-shrink: 0;
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
		justify-content: center;
		flex: 1 1 auto;
		gap: 0.5rem;
	}

	.planner__done-text {
		font-size: clamp(0.8125rem, 1.7vh, 1rem);
		line-height: var(--line-height-normal);
		color: rgb(250 240 230 / 0.85);
	}

	/* ─── Footer controls: one height, one radius, one type size ─── */
	.planner__back,
	.planner__proceed {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: clamp(1.875rem, 3.3vh, 2.25rem);
		border: none;
		border-radius: var(--radius-full);
		font-family: inherit;
		font-size: clamp(0.75rem, 1.5vh, 0.9375rem);
		font-weight: var(--font-weight-medium);
		line-height: 1;
		white-space: nowrap;
		cursor: pointer;
		transition:
			transform var(--motion-hover) var(--ease-hover),
			box-shadow var(--motion-hover) var(--ease-hover),
			background-color var(--motion-hover) var(--ease-hover),
			opacity var(--motion-hover) var(--ease-hover);
	}

	/* A text link with a chevron, not a round icon button: the design gives the
	   step's only real button to Verzenden, and back reads as secondary. */
	.planner__back {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		width: auto;
		min-height: 2.75rem; /* stays a 44px touch target even though it is text */
		padding: 0 0.25rem;
		background: transparent;
		color: var(--pl-ink);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		text-decoration: underline;
		text-underline-offset: 4px;
		flex-shrink: 0;
	}

	.planner__back svg {
		width: 0.9375rem;
		height: 0.9375rem;
	}

	.planner__back:hover {
		background: rgb(var(--pl-tile) / 0.75);
		transform: translateY(var(--lift-hover));
	}

	.planner__proceed {
		padding: 0.5rem 1.25rem;
		/* Was --color-accent-gold-soft: sand on #c7a27a is 2.1:1. Same failure the
		   contact form's submit had, and it hides from the a11y sweep because it
		   only exists on step 3. --brand-border carries this label at 5.25:1. */
		background: var(--brand-border);
		color: var(--pl-ink);
		margin-left: auto;
	}

	.planner__proceed:hover:not(:disabled) {
		transform: translateY(var(--lift-hover));
		box-shadow: var(--shadow-hover);
	}

	.planner__back:active,
	.planner__proceed:active:not(:disabled) {
		transform: translateY(0);
		box-shadow: none;
	}

	.planner__back:focus-visible,
	.planner__proceed:focus-visible {
		outline: 2px solid var(--color-card-warm);
		outline-offset: 2px;
	}

	/* Figma draws only the enabled pill. Disabled reuses it at the opacity the
	   design already gives inactive tiles, so the two read as one system. */
	.planner__proceed:disabled {
		opacity: 0.35;
		cursor: not-allowed;
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
			min-height: 0;
			--pl-gap: 0.5rem;
			/* Desktop fills the card rather than sitting in a narrow column: the
			   e-mail form beside it does, and the two are the same panel. */
			--pl-measure: 100%;
		}

		/* Square by column width — the same rule mobile uses, which is why mobile
		   never had this problem. The vh cap only bites on a short viewport, where
		   it shrinks the tiles rather than letting them stretch. */
		.planner__grid {
			width: min(100%, 62vh);
		}

		.planner__time {
			min-height: clamp(2.75rem, 6.5vh, 4rem);
			font-size: 0.9375rem;
		}
	}

	/* Four columns, as the design draws them — auto-fit lands on six at the full
	   card width and makes the slots look like tags rather than choices. Held
	   back until 1200px, below which the card is too narrow for four labels and
	   forcing them pushes "15:30 - 16:00" out through the side. */
	@media (min-width: 1200px) {
		.planner__times {
			grid-template-columns: repeat(4, 1fr);
		}

		/* 1rem flat, per review — no vh scaling on the desktop calendar. */
		.planner__weekday,
		.planner__cell {
			font-size: 1rem;
		}
	}
</style>
