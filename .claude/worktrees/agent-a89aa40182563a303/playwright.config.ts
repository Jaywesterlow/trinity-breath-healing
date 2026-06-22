import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'pnpm preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests/integration'
};

export default config;
