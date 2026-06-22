/**
 * SCH-01 source of truth — @graph composer.
 * Composes shared nodes + page-specific nodes into a single AnyNode[] array,
 * deduplicated by @id (Pitfall #6 — one @graph per page, never two JSON-LD scripts).
 *
 * Shared nodes (always present):
 *   Organization, ProfessionalService, Person, WebSite, 4 x Service = 8 nodes
 *
 * Page-specific nodes (e.g., WebPage, BreadcrumbList, FAQPage) are appended,
 * EXCEPT if they carry an @id that matches a shared node (deduplicated by @id).
 *
 * @id dedup rule:
 *   - If a pageSpecific node has no @id → always appended.
 *   - If a pageSpecific node @id matches a shared @id → pageSpecific replaces shared.
 *   - The shared node @ids are stable (per interfaces block in 00-03-PLAN.md).
 */
import type { Thing } from 'schema-dts';
import {
	organizationNode,
	professionalServiceNode,
	personNode,
	webSiteNode
} from '$lib/schema/shared';
import { allServiceNodes } from '$lib/schema/services';

/** Generic schema.org node — schema-dts Thing covers all Schema.org types */
export type AnyNode = Thing;

const SHARED_NODES: AnyNode[] = [
	organizationNode,
	professionalServiceNode,
	personNode,
	webSiteNode,
	...allServiceNodes
];

export function buildGraph(opts: { pageSpecific: AnyNode[]; path: string }): AnyNode[] {
	// Build a map of shared nodes keyed by @id (stable keys)
	const nodeMap = new Map<string | undefined, AnyNode>();
	for (const node of SHARED_NODES) {
		const id = (node as { '@id'?: string })['@id'];
		nodeMap.set(id, node);
	}

	// Nodes without @id are always appended; nodes with matching @id replace the shared entry
	const extraNodes: AnyNode[] = [];
	for (const node of opts.pageSpecific) {
		const id = (node as { '@id'?: string })['@id'];
		if (id !== undefined && nodeMap.has(id)) {
			// Replace shared node with page-specific override
			nodeMap.set(id, node);
		} else {
			extraNodes.push(node);
		}
	}

	return [...nodeMap.values(), ...extraNodes];
}
