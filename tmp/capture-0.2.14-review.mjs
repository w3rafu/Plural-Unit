import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:4174';
const outputDir = path.resolve('tmp/screens-0.2.14-review');

const captures = [
	{
		name: 'home-desktop.png',
		url: '/?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'dark'
	},
	{
		name: 'messages-desktop.png',
		url: '/messages?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'dark',
		prepare: async (page) => {
			await page.getByRole('button', { name: /Chloe Bennett/i }).first().click();
			await page.getByRole('button', { name: 'Mute conversation' }).waitFor();
		}
	},
	{
		name: 'directory-desktop.png',
		url: '/directory?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'dark'
	},
	{
		name: 'organization-members-desktop.png',
		url: '/organization?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'dark',
		prepare: async (page) => {
			await page.getByLabel('Organization sections').getByRole('button', { name: 'Members' }).click();
			await page.getByText('Deletion requests', { exact: true }).waitFor();
		}
	},
	{
		name: 'profile-desktop.png',
		url: '/profile?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'dark'
	},
	{
		name: 'volunteers-desktop.png',
		url: '/volunteers?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'dark'
	},
	{
		name: 'signup-desktop.png',
		url: '/signup/vol-event-1?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'light'
	},
	{
		name: 'checkin-desktop.png',
		url: '/volunteers/vol-event-1/checkin?smoke=1',
		viewport: { width: 1440, height: 1180 },
		colorScheme: 'dark'
	},
	{
		name: 'home-mobile.png',
		url: '/?smoke=1',
		viewport: { width: 430, height: 1180 },
		colorScheme: 'dark'
	},
	{
		name: 'volunteers-mobile.png',
		url: '/volunteers?smoke=1',
		viewport: { width: 430, height: 1180 },
		colorScheme: 'dark'
	},
	{
		name: 'signup-mobile.png',
		url: '/signup/vol-event-1?smoke=1',
		viewport: { width: 430, height: 1180 },
		colorScheme: 'light'
	},
	{
		name: 'checkin-mobile.png',
		url: '/volunteers/vol-event-1/checkin?smoke=1',
		viewport: { width: 430, height: 1180 },
		colorScheme: 'dark'
	}
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
	for (const capture of captures) {
		const context = await browser.newContext({
			viewport: capture.viewport,
			colorScheme: capture.colorScheme,
			deviceScaleFactor: 1
		});
		const page = await context.newPage();
		await page.goto(`${baseUrl}${capture.url}`, { waitUntil: 'networkidle' });
		if (capture.prepare) {
			await capture.prepare(page);
		}
		await page.screenshot({ path: path.join(outputDir, capture.name), fullPage: true });
		await context.close();
	}
} finally {
	await browser.close();
}

console.log(`Saved ${captures.length} screenshots to ${outputDir}`);