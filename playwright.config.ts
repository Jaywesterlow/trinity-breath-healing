import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		// Invoke vite directly to avoid the Windows cmd.exe & path issue
		// (npm run scripts go through cmd.exe; node + relative path does not).
		command: 'node node_modules/vite/bin/vite.js preview',
		port: 4173,
		reuseExistingServer: !process.env.CI,
		// The contact endpoint throttles per IP; the whole suite shares one, so
		// lift the ceiling here or the tests start rate-limiting each other.
		env: { CONTACT_RATE_LIMIT_MAX: '1000' }
	},
	testDir: 'tests/integration',
	// Escape hatch for sandboxes that ship a prebuilt Chromium whose revision
	// does not match the pinned @playwright/test. Unset locally, so developer
	// machines keep using Playwright's own managed download.
	use: process.env.PLAYWRIGHT_CHROMIUM_PATH
		? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
		: {}
};

export default config;
