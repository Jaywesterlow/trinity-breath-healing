export const MOCK_SITE_URL = 'https://trinity-breath-healing.vercel.app';

/**
 * Vitest setup (wired as `setupFiles` for the unit project in vite.config.ts).
 *
 * `$env/dynamic/public` compiles, in a browser-ish environment, to
 * `export const env = globalThis.__sveltekit_dev.env` — a global SvelteKit
 * injects at runtime and jsdom knows nothing about, so merely importing a
 * component that reads public env (DatePlanner) throws at import time.
 * Standing the global up here keeps that read a no-op in unit tests; anything
 * that needs a value can assign onto this object.
 */
declare global {
	var __sveltekit_dev: { env: Record<string, string> } | undefined;
}

globalThis.__sveltekit_dev ??= { env: {} };
globalThis.__sveltekit_dev.env ??= {};
