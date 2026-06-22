// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// SEO-09 (Plan 05): Vite-injected build date constant — YYYY-MM-DD string.
// Consumed by src/routes/+page.ts (feeds both meta.dateModified and JSON-LD WebPage.dateModified).
declare const __BUILD_DATE__: string;

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
