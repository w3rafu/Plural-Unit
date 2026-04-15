import { defineConfig } from '@playwright/test';

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'dot' : 'list',
	use: {
		baseURL,
		trace: 'on-first-retry',
		viewport: { width: 1280, height: 1200 }
	},
	projects: [
		{
			name: 'chromium',
			use: {
				browserName: 'chromium'
			}
		}
	],
	webServer: {
		command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
