// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/**
	 * Vite-injected build-time constant (SEO-09 / BLOCKER-3).
	 * Defined in vite.config.ts `define: { __BUILD_DATE__: JSON.stringify(...) }`.
	 * Resolves to a YYYY-MM-DD string at build time (e.g. '2026-06-20').
	 * Consumed by src/routes/+page.ts → meta.dateModified → visible <time datetime>
	 * AND JSON-LD WebPage.dateModified. Single source of truth for SEO-09.
	 */
	const __BUILD_DATE__: string;
}

export {};
