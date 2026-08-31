/**
 * The schedule is the seam the CMS will replace. These cases pin the contract
 * the planner depends on, so swapping the source cannot silently change it.
 */
import { describe, it, expect } from 'vitest';
import {
	DEFAULT_SCHEDULE,
	firstBookableDate,
	isBookable,
	isoWeekday,
	slotsFor,
	toIso,
	type Schedule
} from '$lib/booking/schedule';

/** Monday 8 June 2026, 09:00 — the day the Figma frame draws. */
const MONDAY = '2026-06-08';
const now = new Date(2026, 5, 1, 9, 0, 0);

describe('slotsFor', () => {
	it("offers the practitioner's evening window in 30-minute slots", () => {
		const slots = slotsFor(DEFAULT_SCHEDULE, MONDAY, now);
		expect(slots).toHaveLength(4);
		expect(slots[0]!.label).toBe('19:00 - 19:30');
		expect(slots.at(-1)!.label).toBe('20:30 - 21:00');
	});

	it('never runs past the closing time', () => {
		for (const slot of slotsFor(DEFAULT_SCHEDULE, MONDAY, now)) {
			expect(slot.end <= '21:00').toBe(true);
		}
	});

	it('offers nothing on a weekend, because the schedule has no window for it', () => {
		expect(slotsFor(DEFAULT_SCHEDULE, '2026-06-13', now)).toEqual([]);
	});

	it('offers nothing on a closed date', () => {
		const schedule: Schedule = { ...DEFAULT_SCHEDULE, closedDates: [MONDAY] };
		expect(slotsFor(schedule, MONDAY, now)).toEqual([]);
	});

	it('drops slots inside the lead time', () => {
		// 09:00 on the day itself, with 24h notice required — nothing left today.
		const sameDay = new Date(2026, 5, 8, 9, 0, 0);
		expect(slotsFor(DEFAULT_SCHEDULE, MONDAY, sameDay)).toEqual([]);
	});

	it('honours a schedule the CMS could supply verbatim', () => {
		const schedule: Schedule = {
			slotMinutes: 45,
			openingHours: [{ weekday: 6, from: '09:00', to: '11:00' }],
			closedDates: [],
			leadTimeHours: 0,
			horizonDays: 30
		};
		const saturday = slotsFor(schedule, '2026-06-13', now);
		expect(saturday.map((s) => s.label)).toEqual(['09:00 - 09:45', '09:45 - 10:30']);
	});
});

describe('isBookable', () => {
	it('rejects a date in the past', () => {
		expect(isBookable(DEFAULT_SCHEDULE, '2026-05-29', now)).toBe(false);
	});

	it('rejects a date beyond the horizon', () => {
		const far = toIso(new Date(2026, 5, 1 + DEFAULT_SCHEDULE.horizonDays + 1));
		expect(isBookable(DEFAULT_SCHEDULE, far, now)).toBe(false);
	});

	it('accepts a weekday inside the window', () => {
		expect(isBookable(DEFAULT_SCHEDULE, MONDAY, now)).toBe(true);
	});
});

describe('isoWeekday', () => {
	it('puts Monday at 1 and Sunday at 7', () => {
		expect(isoWeekday(new Date(2026, 5, 8))).toBe(1);
		expect(isoWeekday(new Date(2026, 5, 14))).toBe(7);
	});
});

describe('firstBookableDate', () => {
	/* The planner opens on the month this returns, so an off-by-one here shows up
	   as a calendar that opens on an empty grid with its back arrow disabled. */

	it('skips today when every remaining slot is inside the lead time', () => {
		// Monday 20:00. The window closes at 21:00 and nothing is bookable inside
		// 24 hours, so today and tomorrow-until-20:00 are both out.
		const monday2000 = new Date(2026, 5, 8, 20, 0, 0);
		const first = firstBookableDate(DEFAULT_SCHEDULE, monday2000);
		expect(first).toBe('2026-06-09');
	});

	it('crosses into the next month when the current one has nothing left', () => {
		// Tuesday 30 June 2026, 20:00 — the last weekday evening of the month,
		// already inside the lead time. The answer has to be in July.
		const lastEvening = new Date(2026, 5, 30, 20, 0, 0);
		expect(firstBookableDate(DEFAULT_SCHEDULE, lastEvening)).toBe('2026-07-01');
	});

	it('skips the weekend, which has no window at all', () => {
		// Friday 12 June 2026, 20:00 — past Friday's window, and Sat/Sun are shut.
		const friday = new Date(2026, 5, 12, 20, 0, 0);
		expect(firstBookableDate(DEFAULT_SCHEDULE, friday)).toBe('2026-06-15');
	});

	it('returns null for a schedule that opens on no day at all', () => {
		const shut: Schedule = { ...DEFAULT_SCHEDULE, openingHours: [] };
		expect(firstBookableDate(shut, new Date(2026, 5, 1, 9, 0, 0))).toBeNull();
	});
});
