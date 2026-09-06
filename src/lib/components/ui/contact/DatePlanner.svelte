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
	import { fade, fly, slide } from 'svelte/transition';
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

	/* The sheet's own heading: "Vrijdag 11 september — 19.00 tot 21.00 uur". The
	   window comes from the day's real slots rather than a constant, so a day
	   with different hours says so. */
	/** "Maandag 7 september" — the design's own wording for a chosen day. */
	function namedDay(iso: string): string {
		const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
		const spoken = WEEKDAYS[isoWeekday(new Date(year, month - 1, day)) - 1]!.long;
		return `${spoken.charAt(0).toUpperCase() + spoken.slice(1)} ${day} ${MONTHS[month - 1]!.toLowerCase()}`;
	}

	/** "Maandag 7 september, 19:00" — the heading on step 3 and on the confirmation. */
	const chosenLabel = $derived(
		selectedDate ? `${namedDay(selectedDate)}${selectedSlot ? `, ${selectedSlot.start}` : ''}` : ''
	);

	const sheetLabel = $derived.by(() => {
		if (!selectedDate) return '';
		const named = namedDay(selectedDate);
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
			<div
				class="planner__step"
				class:planner__step--short={step === 'gegevens' || step === 'klaar'}
				in:stepIn
				out:stepOut
			>
				{#if step === 'datum' || step === 'tijd'}
					<div class="planner__head">
						<p class="planner__month" id="planner-month" aria-live="polite">{monthLabel}</p>
						<div class="planner__nav-pair">
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
					</div>

					<!-- Keyed on the month so a change is a fade, not a redraw in place. -->
					{#key `${viewYear}-${viewMonth}`}
						<div
							class="planner__grid"
							role="grid"
							aria-labelledby="planner-month"
							in:fade={{ duration: motionless() ? 0 : 180, easing: cubicOut }}
						>
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
												data-tooltip={labelFor(day)}
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
					{/key}
				{:else if step === 'klaar'}
					<div class="planner__done" role="status">
						<p class="planner__date">{chosenLabel}</p>
						<p class="planner__done-text">{confirmation}</p>
					</div>
				{:else}
					<p class="planner__date">{chosenLabel}</p>
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
								aria-label={slot.taken ? `${slot.label} — al bezet` : undefined}
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
								{slot.label}
							</button>
						{/each}
					</div>
				{:else}
					<p class="planner__empty">Op deze dag zijn geen tijden meer vrij. Kies een andere dag.</p>
				{/if}
			</div>
		{/if}
	</div>

	<!-- The footer never moves between steps: only what sits in it changes. Step 1
	     is the exception — the calendar is the whole step and there is nothing to
	     press, so the footer is not rendered at all rather than standing empty
	     where the design's hint line used to be. -->
	{#if step !== 'datum'}
		<div class="planner__footer">
			{#if step === 'klaar'}
				<button
					class="planner__proceed text-roll roll-host"
					type="button"
					onclick={restart}
					data-label="Nog een moment plannen"
				>
					<span class="text-roll__face">Nog een moment plannen</span>
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
						class="planner__proceed text-roll"
						class:roll-host={detailsReady && !sending}
						type="button"
						disabled={!detailsReady || sending}
						onclick={book}
						data-label={sending ? 'Versturen…' : 'Verzenden'}
					>
						<span class="text-roll__face">{sending ? 'Versturen…' : 'Verzenden'}</span>
					</button>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Every value here comes from the design frame, not from an eyeball of it:
	   the card is sand with a hairline border, the tiles are bare circles, and
	   nothing is white-on-green any more. The old dark-green card is gone. */
	.planner {
		--pl-line: rgba(124, 94, 73, 0.22);
		--pl-ink: var(--color-fg-forest); /* #3d4a35 */
		--pl-radius: 0.625rem; /* 10px */
		--panel-bg: var(--color-panel);

		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		min-height: 0;
		padding: 1.75rem; /* 28px */
		background: var(--panel-bg);
		border: 1px solid var(--pl-line);
		border-radius: 1.125rem; /* 18px */
		color: var(--pl-ink);
		font-family: var(--font-body);
		/* Nothing here scrolls. Every step is sized to fit the card; content that
		   exceeds it is a sizing bug to fix, never a scrollbar to add. */
		overflow: hidden;
	}

	/* ─── Stepper ─── */
	.planner__steps {
		display: flex;
		align-items: center;
		gap: 0.625rem; /* 10px */
		margin-bottom: 1.25rem; /* 20px */
		flex-shrink: 0;
	}

	.planner__dashes {
		display: inline-flex;
		align-items: center;
		gap: 0.625rem;
	}

	.planner__dash {
		width: 1.625rem; /* 26px */
		height: 3px;
		border-radius: 2px;
		background: rgba(124, 94, 73, 0.25);
		transition: background-color var(--motion-base) var(--ease-out);
	}

	.planner__dash--done {
		background: var(--brand-border); /* #7c5e49 */
	}

	.planner__steps-label {
		font-size: 0.8125rem; /* 13px */
		color: var(--brand-muted);
		margin-left: 0.5rem; /* 8px */
	}

	/* ─── Stage ─── */
	/* Clips its own content. .planner__step is absolutely positioned at inset 0,
	   so anything a pixel taller than the stage paints straight over the footer
	   — which is how the calendar's trailing empty cells ended up swallowing
	   clicks on Vorige. */
	.planner__stage {
		position: relative;
		flex: 1 1 auto;
		min-height: 0;
		overflow: hidden;
	}

	/* And the footer sits above it either way. */
	.planner__footer {
		position: relative;
		z-index: 3;
	}

	.planner__step {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
	}

	/* The card is one size for every step, because switching panels must not
	   resize it — the calendar sets that size and the form needs less. The
	   design draws each step in its own frame, so it never has to answer this.
	   Centring the shorter steps is the closest that gets: the spare height sits
	   above and below the block rather than as a hole under it. */
	.planner__step--short {
		justify-content: center;
	}

	/* ─── Month row ─── */
	/* The design draws the month as a plain label with no arrows. The arrows stay
	   because the booking window runs past this month and the label alone cannot
	   reach it — they are the one control the frame left out. Styled down to
	   match: same 13px label, hairline chevrons, no chrome. */
	/* The design puts the month at the left with nothing beside it. The arrows
	   are the one control it left out, so they sit as a pair at the far end
	   rather than bracketing the label — the label keeps the design's position
	   and the month stays navigable. */
	.planner__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.planner__nav-pair {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.planner__month {
		font-size: 0.8125rem; /* 13px */
		font-weight: var(--font-weight-medium);
		color: var(--pl-ink);
		margin: 0;
	}

	.planner__nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		color: var(--brand-border);
		cursor: pointer;
		transition: opacity var(--motion-hover) var(--ease-hover);
	}

	.planner__nav svg {
		width: 0.9375rem;
		height: 0.9375rem;
	}

	.planner__nav:hover:not(:disabled) {
		opacity: 0.7;
	}

	.planner__nav:disabled {
		opacity: 0.25;
		cursor: default;
	}

	.planner__nav:focus-visible,
	.planner__day:focus-visible,
	.planner__time:focus-visible,
	.planner__back:focus-visible,
	.planner__proceed:focus-visible,
	.planner__input:focus-visible {
		outline: 2px solid var(--color-accent-gold);
		outline-offset: 2px;
	}

	/* ─── Calendar ─── */
	.planner__grid {
		display: flex;
		flex-direction: column;
		flex: 0 0 auto;
		gap: 0.375rem; /* 6px */
		margin-top: 0.875rem; /* 14px */
	}

	.planner__row {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		column-gap: 0.375rem;
	}

	/* A bare circle: no fill, no border, no tile. 75% of the column rather than
	   all of it — at full width the selected day read as a disc rather than a
	   marked date. The column itself is unchanged, so the grid does not move. */
	.planner__cell {
		display: flex;
		align-items: center;
		justify-content: center;
		justify-self: center;
		aspect-ratio: 1;
		width: 75%;
		border: none;
		border-radius: var(--radius-full);
		background: transparent;
		font-family: inherit;
		font-size: 0.875rem; /* 14px */
		line-height: 1;
		color: var(--pl-ink);
	}

	.planner__day {
		cursor: pointer;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			color var(--motion-hover) var(--ease-hover);
	}

	.planner__day[aria-disabled='true'] {
		color: rgba(132, 137, 129, 0.5);
		cursor: default;
	}

	.planner__day--open:hover {
		background: color-mix(in srgb, var(--brand-border) 12%, transparent);
	}

	.planner__day--open.planner__day--selected,
	.planner__day--open.planner__day--selected:hover {
		background: var(--brand-border);
		color: var(--color-bg-sand);
	}

	/* ─── Step 2 sheet ─── */
	.planner__sheet {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 2;
		padding: 1.375rem 1.75rem 1.625rem; /* 22px 28px 26px */
		/* No fill and no shadow: the blur alone is what separates it from the
		   calendar, and the month stays visible through it. A hairline top edge
		   is all that draws the boundary. */
		background: transparent;
		backdrop-filter: blur(16px);
		border-top: 1px solid var(--pl-line);
		border-radius: 1.125rem 1.125rem 0 0;
	}

	.planner__grabber {
		display: block;
		width: 2.375rem; /* 38px */
		height: 4px;
		border-radius: 2px;
		background: rgba(124, 94, 73, 0.3);
		margin: 0 auto 1rem; /* 16px */
	}

	.planner__sheet-date,
	.planner__date {
		font-size: 0.8125rem; /* 13px */
		font-weight: var(--font-weight-medium);
		color: var(--pl-ink);
		margin: 0;
	}

	/* The layout this had before the four-tile version: auto-fit, so the column
	   count follows the width and whatever the schedule offers rather than being
	   fixed at two. */
	.planner__times {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 7.5rem), 1fr));
		gap: 0.625rem;
		margin-top: 1rem; /* 16px */
	}

	.planner__time {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem; /* 44px — a touch target, and the ranges are wider */
		padding: 0.375rem 0.5rem;
		border: 1px solid rgba(124, 94, 73, 0.3);
		border-radius: var(--pl-radius);
		background: transparent;
		color: var(--pl-ink);
		font-family: inherit;
		font-size: 0.9375rem; /* 15px */
		line-height: 1;
		cursor: pointer;
		transition:
			background-color var(--motion-hover) var(--ease-hover),
			color var(--motion-hover) var(--ease-hover);
	}

	.planner__time:hover:not([aria-disabled='true']) {
		background: color-mix(in srgb, var(--brand-border) 10%, transparent);
	}

	.planner__time--selected,
	.planner__time--selected:hover {
		background: var(--brand-border);
		border-color: var(--brand-border);
		color: var(--color-bg-sand);
	}

	.planner__time--taken {
		opacity: 0.4;
		cursor: default;
	}

	.planner__empty {
		font-size: 0.8125rem;
		font-weight: var(--font-weight-light);
		color: var(--brand-muted);
		margin: 1rem 0 0;
	}

	/* ─── Step 3 ─── */
	.planner__fields {
		display: flex;
		flex-direction: column;
		flex: 0 0 auto;
		min-height: 0;
		gap: 0.875rem; /* 14px */
		margin-top: 0.875rem;
	}

	.planner__field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem; /* 12px */
	}

	.planner__field {
		display: flex;
		flex-direction: column;
		gap: 0.4375rem; /* 7px */
	}

	.planner__field--grow {
		flex: 0 1 auto;
		min-height: 0;
	}

	.planner__label {
		font-size: 0.6875rem; /* 11px */
		font-weight: var(--font-weight-medium);
		color: var(--brand-border);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	/* No opacity: 0.75 of --brand-border on sand computes to #9c8370, which is
	   3.16:1 at 11px. The label's own brown is 5.25:1 and the lower case is
	   already what sets this word apart from the label. */
	.planner__optional {
		text-transform: none;
		letter-spacing: 0;
	}

	.planner__input {
		width: 100%;
		min-height: 3rem; /* 48px */
		padding: 0.8125rem 1rem; /* 13px 16px */
		background: transparent;
		border: 1px solid rgba(124, 94, 73, 0.28);
		border-radius: var(--pl-radius);
		color: var(--pl-ink);
		font-family: inherit;
		/* 16px below desktop: iOS Safari zooms the page when a focused input is
		   smaller than that. The design's 14px applies from 1024px up, where no
		   phone is looking. Same rule in ContactForm. */
		font-size: 1rem;
		line-height: var(--line-height-normal);
		transition: border-color var(--motion-hover) var(--ease-hover);
	}

	@media (min-width: 1024px) {
		.planner__input {
			font-size: 0.875rem; /* 14px */
		}
	}

	.planner__input::placeholder {
		/* Lighter than the value it stands in for, so the two cannot be confused —
		   --color-text-subtle is the body-copy colour and read as real input.
		   72% lands at 3.01:1 on the panel: clearly a placeholder, and still above
		   the 3:1 floor. Every field has a real visible <label>, so this text is a
		   redundant example rather than the only cue. */
		color: color-mix(in srgb, var(--color-text-subtle) 72%, transparent);
	}

	/* Chrome paints its own fill behind an autofilled field, as a background the
	   page cannot restyle — square, so it cut the corners off the 10px radius.
	   An inset shadow is the one thing that paints inside the border box and
	   follows its radius, so it covers Chrome's fill instead of fighting it. */
	.planner__input:-webkit-autofill,
	.planner__input:-webkit-autofill:hover,
	.planner__input:-webkit-autofill:focus {
		-webkit-box-shadow: 0 0 0 3rem var(--panel-bg) inset;
		-webkit-text-fill-color: var(--color-fg-forest);
		caret-color: var(--color-fg-forest);
		transition: background-color 100000s ease-in-out 0s;
	}

	.planner__input:hover,
	.planner__input:focus {
		border-color: var(--brand-border);
	}

	.planner__input--area {
		min-height: 4.75rem; /* 76px */
		padding-top: 0.875rem; /* 14px */
		resize: vertical;
		max-height: 9rem;
	}

	.planner__input[aria-invalid='true'] {
		border-color: #a8442f;
	}

	.planner__error {
		font-size: 0.75rem;
		color: #a8442f;
		margin: 0;
	}

	/* Off-screen rather than display:none, so a bot filling every field still
	   fills it. Restoring this: the rule was lost when this stylesheet was
	   rewritten, which put "Laat dit veld leeg" on the page in plain sight. */
	.planner__honeypot {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	/* ─── Footer ─── */
	/* :empty rather than a step-specific class: whatever the reason the footer
	   has nothing in it, it should take no height — margin included. */
	.planner__footer {
		display: flex;
		align-items: center;
		gap: 1.25rem; /* 20px */
		flex-shrink: 0;
		margin-top: 1.125rem; /* 18px */
	}

	.planner__back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem; /* 8px */
		min-height: 2.75rem; /* stays a 44px target even though it reads as text */
		padding: 0;
		border: none;
		background: transparent;
		color: var(--brand-border);
		font-family: inherit;
		font-size: 0.9375rem; /* 15px */
		text-decoration: underline;
		text-underline-offset: 4px;
		cursor: pointer;
	}

	.planner__back svg {
		width: 0.9375rem;
		height: 0.9375rem;
	}

	/* ButtonLink's own values: Cormorant 400 at 20px on --brand-border. */
	.planner__proceed {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: auto;
		/* Height rather than vertical padding, for the same reason as
		   .form__submit: the roll clips at the padding edge. */
		height: var(--space-10);
		padding: 0 1.875rem; /* 30px */
		border: none;
		border-radius: var(--radius-full);
		background: var(--brand-border);
		color: var(--color-bg-sand);
		font-family: var(--font-display);
		font-size: var(--font-size-xl); /* 20px */
		font-weight: 400;
		line-height: 1;
		cursor: pointer;
		transition: transform var(--motion-hover) var(--ease-hover);
	}

	.planner__proceed:hover:not(:disabled) {
		transform: translateY(var(--lift-hover));
	}

	.planner__proceed:active:not(:disabled) {
		transform: translateY(0);
	}

	.planner__proceed:disabled {
		opacity: 0.45;
		cursor: default;
	}

	/* ─── Confirmation ─── */
	.planner__done {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		justify-content: center;
		height: 100%;
	}

	.planner__done-text {
		font-size: 0.9375rem;
		font-weight: var(--font-weight-light);
		line-height: var(--line-height-normal);
		color: var(--brand-muted);
		margin: 0;
	}
</style>
