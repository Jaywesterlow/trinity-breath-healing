import { z } from 'zod';

export const frontmatterSchema = z.object({
	title: z.string(),
	datePublished: z.string().date(),
	dateModified: z.string().date().optional(),
	author: z.string()
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export function loadCollection<T extends Frontmatter = Frontmatter>(
	glob: Record<string, unknown>
): Array<{ path: string; frontmatter: T; default: unknown }> {
	return Object.entries(glob).map(([path, entry]) => {
		const mod = entry as { metadata: unknown; default: unknown };
		try {
			const frontmatter = frontmatterSchema.parse(mod.metadata) as T;
			return { path, frontmatter, default: mod.default };
		} catch (err) {
			throw new Error(`[loadCollection] Invalid frontmatter in ${path}: ${String(err)}`);
		}
	});
}

// Convention: downstream collections extend or replace this glob
export const collections = import.meta.glob('./**/*.svx', { eager: true });
