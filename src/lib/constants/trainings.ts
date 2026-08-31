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
 * `provider` comes from photographs of the certificates themselves (30-08), not
 * from memory or inference. A named school is what turns "she says she trained"
 * into something a reader can check, and it is the half of the credential that
 * `recognizedBy` wants in the JSON-LD. Four courses still have none: the two
 * Mahatma neveninitiaties (which appear as seals on the Master certificate
 * rather than as separate documents) and both Soul Alchemist modules, for which
 * no certificate was in the photograph.
 *
 * SPELLING is now the certificates', which settled both open questions and
 * overruled me on one: the document reads "GTUMMO", so her "Gtummo" was right
 * and my tidy to "G-Tummo" was wrong. "The Sorcerers Symphony" is confirmed as
 * printed, with no apostrophe. Only "NlP" -> "NLP" remains a correction, and
 * the certificate confirms it.
 *
 * NOT RECORDED, deliberately: the Trauma Release certificate carries her date
 * of birth. It is on the document because the institute puts it there; it has
 * no business being in a repository or on a public page.
 */

export type Training = {
	/** ISO year-month. Sorts correctly as a string, and no course gave a day. */
	date: string;
	/** Month and year as a Dutch reader expects to see it. */
	dateLabel: string;
	name: string;
	/** The school, exactly as the certificate prints it. Absent where no
	    certificate was photographed. */
	provider?: string;
	/** Not yet taken — rendered apart from the completed list, never as a credential. */
	planned?: true;
	/** A refresher of a course already on the list, not a new qualification. */
	repeat?: true;
};

export const TRAININGS: Training[] = [
	{
		date: '2024-01',
		dateLabel: 'januari 2024',
		name: 'Mahatma Avatar van Synthese Master',
		provider: 'One Consciousness Academy'
	},
	{ date: '2024-03', dateLabel: 'maart 2024', name: 'Mahatma Master — neveninitiatie 1' },
	{ date: '2024-06', dateLabel: 'juni 2024', name: 'Mahatma Master — neveninitiatie 2' },
	{
		date: '2024-08',
		dateLabel: 'augustus 2024',
		name: 'Trauma Release & Breathwork — BRTT en TRB',
		provider: 'Inner Journey — Institute for Trauma Release and Breathwork'
	},
	{
		date: '2024-11',
		dateLabel: 'november 2024',
		name: 'The Sorcerers Symphony — Advanced 1, Ancestral Work',
		provider: 'One Consciousness Academy'
	},
	{
		date: '2025-02',
		dateLabel: 'februari 2025',
		name: 'Mahakali Empowerment & Gtummo Healing and Protection',
		provider: 'One Consciousness Academy'
	},
	{
		date: '2025-04',
		dateLabel: 'april 2025',
		name: 'NLP Practitioner',
		provider: 'Sluis NLP Instituut'
	},
	{
		date: '2025-05',
		dateLabel: 'mei 2025',
		name: 'Mahatma Avatar van Synthese Master — herhaling',
		provider: 'One Consciousness Academy',
		repeat: true
	},
	{
		date: '2025-12',
		dateLabel: 'december 2025',
		name: 'Spinal Touch® Facilitator',
		provider: 'Het Coach Lokaal'
	},
	{ date: '2026-01', dateLabel: 'januari 2026', name: 'Soul Alchemist — module 1' },
	{
		date: '2026-03',
		dateLabel: 'maart 2026',
		name: 'Spinal Touch® Facilitator — module 2',
		provider: 'Het Coach Lokaal'
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
