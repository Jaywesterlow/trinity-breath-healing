/**
 * SCH-07 source of truth — FAQPage builder.
 * buildFaqPage(entries) returns a typed FAQPage from the same input array
 * that Phase 1 LND-07 will render as visible FAQ accordion — single source of truth.
 *
 * WARNING-2 / Phase 0 contract:
 * buildFaqPage([]) returns a structurally valid FAQPage with mainEntity=[].
 * Plan 08 validate-json-ld.ts MUST NOT assert mainEntity.length > 0 in Phase 0.
 * That gate flips on in Phase 1 LND-07 when real FAQ entries land.
 *
 * No @id on FAQPage (per-page transient).
 */
import type { FAQPage } from 'schema-dts';

export function buildFaqPage(entries: { question: string; answer: string }[]): FAQPage {
	return {
		'@type': 'FAQPage',
		mainEntity: entries.map((e) => ({
			'@type': 'Question',
			name: e.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: e.answer
			}
		}))
	};
}
