import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		// Invoke vite directly to avoid the Windows cmd.exe & path issue
		// (npm run scripts go through cmd.exe; node + relative path does not).
		command: 'node node_modules/vite/bin/vite.js preview',
		port: 4173,
		reuseExistingServer: !process.env.CI
	},
	testDir: 'tests/integration'
};

export default config;
