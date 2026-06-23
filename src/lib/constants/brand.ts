/**
 * NAP SOURCE OF TRUTH (LGL-09).
 * Any change must propagate to:
 *   - SiteFooter content (Phase 1 LND-08)
 *   - Organization/ProfessionalService JSON-LD emitter (Plan 03)
 *   - Instagram bio + KvK record
 * NEVER hand-edit downstream copies — always update here first.
 *
 * TODO placeholders below are tracked in .planning/phases/00-foundation-seo-scaffolding/UNKNOWNS.md.
 * CI grep flags TODO_ values as warnings; Phase 5 launch gate blocks on residual TODO_ in this file.
 */

export const BRAND = {
	/** Legal business name — must match KvK registration */
	legalName: 'Trinity Breath & Healing',

	/** Display name used in UI, meta title prefix, og:site_name */
	shortName: 'TRINITY Breath & Healing',

	/** Practitioner's full legal name — required for Person schema + E-E-A-T */
	practitionerFullName: 'TODO_PRACTITIONER_NAME',

	/** Primary contact email — locked per REQUIREMENTS LND-08 + 00-CONTEXT.md footer block */
	email: 'info@trinitybnh.nl',

	/** E.164 formatted business phone — locked when practitioner provides it */
	phone: 'TODO_PHONE',

	/** Social media profiles */
	socials: {
		/** Instagram handle including @ — primary channel for existing audience */
		instagram: 'TODO_INSTAGRAM_HANDLE',
		/** Facebook page URL — null until practitioner confirms presence */
		facebook: null as string | null,
		/** X (Twitter) handle — null; practitioner not active on X */
		x: null as string | null
	},

	/**
	 * Service area for Schema.org Service.areaServed + ProfessionalService.areaServed.
	 * Locked by CONTEXT.md D-04 (areaServed decision) + D-08 (Schema.org source-of-truth).
	 * Matches Figma copy and REQUIREMENTS LND-08 NAP block.
	 * NEVER edit here without updating JSON-LD emitters in Plan 03 and footer copy in LND-08.
	 */
	areaServed: [
		'Amsterdam',
		'Zaandam',
		'Almere',
		'Weesp',
		'Oostzaan',
		'Hoofddorp',
		'Badhoevedorp'
	] as const,

	/**
	 * Services offered — slugs are the stable identifier for routing + schema @id.
	 * Phase 0 ships stubs; Phase 1 adds content. Plan 03 builds Service schema from this array.
	 * Slugs locked by CONTEXT.md "Service slugs (Dutch)".
	 */
	services: [
		{ slug: 'mahatma-healing', name: 'Mahatma Healing' },
		{ slug: 'goldhealing', name: 'Goldhealing' },
		{ slug: 'raster-energie', name: 'Raster Energie' },
		{ slug: 'spinal-touch', name: 'Spinal Touch' }
	] as const,

	stats: {
		yearsExperience: '8+',
		clientsHelped: '65+',
		satisfaction: '∞',
	} as const
} as const;
