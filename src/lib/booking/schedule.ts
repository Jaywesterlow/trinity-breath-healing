/**
 * Booking availability.
 *
 * This module is the seam the CMS plugs into. The planner never hardcodes an
 * opening time — it asks here. Today `DEFAULT_SCHEDULE` answers; once the
 * practitioner can edit her hours, a `load()` fetches the same `Schedule`
 * shape from the CMS and passes it to `<DatePlanner schedule={...} />`.
 * Nothing in the UI changes when that happens, which is the point.
 *
 * All times are local wall-clock. The practice runs in a single timezone
 * (Europe/Amsterdam) and the visitors booking it are in the same one, so a
 * date here is the date she writes in her diary — no UTC round-trip, and no
 * off-by-one when the clocks change.
 */

export interface OpeningHours {
	/** ISO-8601 weekday: 1 = Monday … 7 = Sunday. */
	weekday: number;
	/** Inclusive start of the window, "HH:MM". */
	from: string;
	/** Exclusive end of the window, "HH:MM". */
	to: string;
}

export interface Schedule {
	/** Length of one bookable slot. The site sells 30-minute calls. */
	slotMinutes: number;
	/** Recurring weekly availability. A weekday with no entry is a day off. */
	openingHours: OpeningHours[];
	/** Whole days blocked off regardless of the weekly pattern, "YYYY-MM-DD". */
	closedDates: string[];
	/** Nothing bookable sooner than this many hours from now. */
	leadTimeHours: number;
	/** Nothing bookable further ahead than this many days. */
	horizonDays: number;
}

export interface TimeSlot {
	/** "HH:MM" the slot starts. */
	start: string;
	/** "HH:MM" the slot ends. */
	end: string;
	/** What the tile shows — Figma writes it "10:00 - 10:30". */
	label: string;
}

/**
 * Until the CMS exists, this is the practitioner's availability.
 *
 * What the planner sells is the 30-minute online kennismaking, and she said
 * where that fits (29-08): *"Kennismaking online door de weeks kan maar in de
 * avonden."* Weekday evenings, not office hours.
 *
 * This used to be Mon-Fri 10:00-16:00 — the twelve slots drawn in Figma 441-48,
 * which were a layout study rather than her diary. Twelve daytime slots she
 * cannot take is worse than four she can: every booking against them is a
 * request she has to decline, and the decline arrives after the visitor has
 * already committed to a time.
 *
 * 19:00-21:00 is the conservative reading of "in de avonden" — narrow on
 * purpose, since an offered slot she cannot make costs more than an unoffered
 * slot she could have. TODO.md §1 tracks confirming the real window with her.
 *
 * `leadTimeHours: 24` is hers too: nothing bookable inside 24 hours, matching
 * the 24-hour free cancellation window in CANCELLATION_HOURS.
 */
export const DEFAULT_SCHEDULE: Schedule = {
	slotMinutes: 30,
	openingHours: [1, 2, 3, 4, 5].map((weekday) => ({ weekday, from: '19:00', to: '21:00' })),
	closedDates: [],
	leadTimeHours: 24,
	horizonDays: 90
};

/** "YYYY-MM-DD" for a local date, without going near UTC. */
export function toIso(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

/** Parse "YYYY-MM-DD" into a local midnight Date. */
export function fromIso(iso: string): Date {
	const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
	return new Date(year, month - 1, day);
}

/** ISO-8601 weekday (1 = Monday … 7 = Sunday); JS puts Sunday at 0. */
export function isoWeekday(date: Date): number {
	return date.getDay() === 0 ? 7 : date.getDay();
}

function minutesOf(time: string): number {
	const [hours, mins] = time.split(':').map(Number) as [number, number];
	return hours * 60 + mins;
}

function timeOf(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Every slot on a date, already filtered by lead time — a slot that starts in
 * three hours is not offered when she asks for a day's notice.
 */
export function slotsFor(schedule: Schedule, iso: string, now: Date = new Date()): TimeSlot[] {
	if (schedule.closedDates.includes(iso)) return [];

	const date = fromIso(iso);
	const windows = schedule.openingHours.filter((w) => w.weekday === isoWeekday(date));
	const earliest = new Date(now.getTime() + schedule.leadTimeHours * 60 * 60 * 1000);

	const slots: TimeSlot[] = [];
	for (const window of windows) {
		const from = minutesOf(window.from);
		const to = minutesOf(window.to);
		for (let start = from; start + schedule.slotMinutes <= to; start += schedule.slotMinutes) {
			const startsAt = new Date(date);
			startsAt.setHours(0, start, 0, 0);
			if (startsAt < earliest) continue;

			const end = timeOf(start + schedule.slotMinutes);
			slots.push({ start: timeOf(start), end, label: `${timeOf(start)} - ${end}` });
		}
	}
	return slots;
}

/** A date is selectable when it has at least one slot left and is in range. */
export function isBookable(schedule: Schedule, iso: string, now: Date = new Date()): boolean {
	const date = fromIso(iso);
	const today = startOfDay(now);
	if (date < today) return false;

	const horizon = startOfDay(now);
	horizon.setDate(horizon.getDate() + schedule.horizonDays);
	if (date > horizon) return false;

	return slotsFor(schedule, iso, now).length > 0;
}

/**
 * The first date the schedule actually offers, walking forward from today.
 *
 * The planner opens on a month and disables its back arrow there, so "which
 * month do we open on" has to be a real question rather than "the current one".
 * With a six-hour daytime window there was always something bookable within a
 * day or two and the distinction never showed. With a two-hour evening window
 * and a 24-hour lead time it does: late on the last day of a month, every
 * remaining slot is inside the lead time and the current month has nothing
 * left — so the planner would open on an empty grid with the back arrow
 * disabled and no indication that the answer is one click forward.
 *
 * Returns null when the whole horizon is empty, which only happens if the
 * schedule has no opening hours at all.
 */
export function firstBookableDate(schedule: Schedule, now: Date = new Date()): string | null {
	const start = startOfDay(now);

	for (let offset = 0; offset <= schedule.horizonDays; offset += 1) {
		const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
		const iso = toIso(day);
		if (isBookable(schedule, iso, now)) return iso;
	}

	return null;
}
