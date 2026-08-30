/**
 * Her training history, supplied by the practitioner 2026-08-29.
 *
 * This is the single strongest E-E-A-T asset the site has. Google's guidance
 * for YMYL health topics asks who the practitioner is and what qualifies them,
 * and until now /over-mij answered that with a <Todo> marker. It feeds both the
 * visible list on /over-mij and the Person node's `hasCredential`.
 *
 * Three things are deliberately encoded rather than flattened into prose:
 *
 * `status` — September 2026 has not happened yet. Soul Alchemist module 3 is
 * something she is going to do, not something she has done, and listing a
 * future course among completed qualifications on a health site is exactly the
 * kind of overclaim that costs trust when someone checks. It renders in a
 * separate, clearly-labelled group.
 *
 * `repeat` — May 2025 is a refresher of the January 2024 course, not a second
 * qualification. Counting it twice would inflate the list.
 *
 * `provider` is missing throughout. She gave dates and course names, not
 * institutes, and an E-E-A-T list is markedly stronger with the school named —
 * tracked in TODO.md as an open question rather than guessed at here.
 *
 * SPELLING: names are hers, tidied only where the intent is unambiguous
 * ("NlP" -> "NLP"). Two are marked for her to confirm — see TODO.md — because
 * they are proper names of specific courses and I cannot verify them:
 * "The Sorcerers Symphony" and the "G-Tummo" spelling.
 */

export type Training = {
	/** ISO year-month. Sorts correctly as a string, and no course gave a day. */
	date: string;
	/** Month and year as a Dutch reader expects to see it. */
	dateLabel: string;
	name: string;
	/** Not yet taken — rendered apart from the completed list, never as a credential. */
	planned?: true;
	/** A refresher of a course already on the list, not a new qualification. */
	repeat?: true;
};

export const TRAININGS: Training[] = [
	{ date: '2024-01', dateLabel: 'januari 2024', name: 'Mahatma Avatar van Synthese Master' },
	{ date: '2024-03', dateLabel: 'maart 2024', name: 'Mahatma Master — neveninitiatie 1' },
	{ date: '2024-06', dateLabel: 'juni 2024', name: 'Mahatma Master — neveninitiatie 2' },
	{
		date: '2024-08',
		dateLabel: 'augustus 2024',
		name: 'Trauma Release & Breathwork — BRTT en TRB'
	},
	{
		date: '2024-11',
		dateLabel: 'november 2024',
		name: 'The Sorcerers Symphony — Advanced 1, Ancestral Work'
	},
	{
		date: '2025-02',
		dateLabel: 'februari 2025',
		name: 'Mahakali Empowerment & G-Tummo Healing and Protection'
	},
	{ date: '2025-04', dateLabel: 'april 2025', name: 'NLP Practitioner' },
	{
		date: '2025-05',
		dateLabel: 'mei 2025',
		name: 'Mahatma Avatar van Synthese Master — herhaling',
		repeat: true
	},
	{ date: '2025-12', dateLabel: 'december 2025', name: 'Spinal Touch Facilitator' },
	{ date: '2026-01', dateLabel: 'januari 2026', name: 'Soul Alchemist — module 1' },
	{
		date: '2026-03',
		dateLabel: 'maart 2026',
		name: 'Spinal Touch Facilitator — module 2'
	},
	{ date: '2026-05', dateLabel: 'mei 2026', name: 'Soul Alchemist — module 2' },
	{
		date: '2026-09',
		dateLabel: 'september 2026',
		name: 'Soul Alchemist — module 3',
		planned: true
	}
];

/** Newest first — a visitor scanning the list wants "how recent", not "how long ago". */
export const COMPLETED_TRAININGS = TRAININGS.filter((t) => !t.planned).toReversed();

export const PLANNED_TRAININGS = TRAININGS.filter((t) => t.planned);
