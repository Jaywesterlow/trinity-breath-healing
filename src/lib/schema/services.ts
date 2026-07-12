/**
 * SCH-04 source of truth — per-modality Service schema nodes.
 * makeServiceNode factory + allServiceNodes = BRAND.services.map(...)
 *
 * @id pattern: ${SITE_URL}/#service-{slug}
 * Service url: ${SITE_URL}/diensten/{slug}
 * provider: links to organizationNode @id
 * areaServed: mirrors BRAND.areaServed
 *
 * D-locked: 4 service slugs (mahatma-healing, goldhealing, raster-energie, spinal-touch)
 */
import type { Service } from 'schema-dts';
import { SITE_URL } from '$lib/seo/defaults';
import { BRAND } from '$lib/constants/brand';
import { organizationNode } from '$lib/schema/shared';

// schema-dts Organization type includes `string` union — cast to extract the @id string
const orgId = (organizationNode as unknown as { '@id': string })['@id'];

export function makeServiceNode(slug: string, name: string): Service {
	return {
		'@type': 'Service',
		'@id': `${SITE_URL}/#service-${slug}`,
		name,
		url: `${SITE_URL}/diensten/${slug}`,
		provider: { '@id': orgId },
		areaServed: [...BRAND.areaServed] as string[]
	};
}

/** All 4 locked modality Service nodes — single source of truth for SCH-04 */
export const allServiceNodes: Service[] = BRAND.services.map((s) =>
	makeServiceNode(s.slug, s.name)
);
