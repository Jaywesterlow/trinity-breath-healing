/**
 * SCH-02..SCH-05 source of truth.
 * ProfessionalService (LocalBusiness subclass) chosen over LocalBusiness per D-locked decision:
 * practice is mobile + remote + part-time, no customer storefront.
 *
 * @id strategy (Pattern 6 + Pitfall #6):
 *   ${SITE_URL}/#organization
 *   ${SITE_URL}/#business
 *   ${SITE_URL}/#practitioner
 *   ${SITE_URL}/#website
 */
import type { Organization, ProfessionalService, Person, WebSite } from 'schema-dts';
import { SITE_URL } from '$lib/seo/defaults';
import { BRAND } from '$lib/constants/brand';

/** Filters null/undefined from BRAND.socials for sameAs array */
function getSameAs(): string[] {
	const sameAs: string[] = [];
	if (BRAND.socials.instagram && !BRAND.socials.instagram.startsWith('TODO')) {
		sameAs.push(`https://www.instagram.com/${BRAND.socials.instagram.replace('@', '')}/`);
	}
	if (BRAND.socials.facebook) {
		sameAs.push(BRAND.socials.facebook);
	}
	return sameAs;
}

export const organizationNode: Organization = {
	'@type': 'Organization',
	'@id': `${SITE_URL}/#organization`,
	name: BRAND.legalName,
	url: SITE_URL,
	email: BRAND.email,
	...(getSameAs().length > 0 ? { sameAs: getSameAs() } : {})
};

/**
 * ProfessionalService (a LocalBusiness subclass) — D-locked over LocalBusiness.
 * Practice is mobile + remote + part-time; no public storefront.
 * No `address` field (no physical client-facing address per D-lock).
 * Note: schema-dts ProfessionalServiceLeaf extends LocalBusinessBase which does NOT
 * include `serviceType` (that field is on ServiceBase, not OrganizationBase).
 * Service types are conveyed via the 4 per-modality Service nodes (services.ts).
 */
export const professionalServiceNode: ProfessionalService = {
	'@type': 'ProfessionalService',
	'@id': `${SITE_URL}/#business`,
	name: BRAND.legalName,
	url: SITE_URL,
	email: BRAND.email,
	telephone: BRAND.phone,
	areaServed: [...BRAND.areaServed] as string[],
	parentOrganization: { '@id': `${SITE_URL}/#organization` }
};

export const personNode: Person = {
	'@type': 'Person',
	'@id': `${SITE_URL}/#practitioner`,
	name: BRAND.practitionerFullName,
	jobTitle: 'Ademwerk begeleider',
	// jobTitle will be revisited at Phase 4 once BIG (Big Integrative Governance) status is known
	worksFor: { '@id': `${SITE_URL}/#organization` }
};

export const webSiteNode: WebSite = {
	'@type': 'WebSite',
	'@id': `${SITE_URL}/#website`,
	name: BRAND.legalName,
	url: SITE_URL,
	inLanguage: 'nl-NL',
	publisher: { '@id': `${SITE_URL}/#organization` }
};
