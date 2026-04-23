import { expect, test } from '@playwright/test';

test.describe('directory smoke routes', () => {
	test('opens a member profile and jumps into an existing conversation', async ({ page }) => {
		await page.goto('/directory?smoke=1');

		await expect(page.getByRole('heading', { name: 'Directory' })).toBeVisible();
		const elenaLink = page.locator('a[href="/directory/profile-elena-rossi"]:visible').first();
		await expect(elenaLink).toBeVisible();

		await elenaLink.click();

		await expect(page).toHaveURL(/\/directory\/profile-elena-rossi$/);
		await expect(page.getByRole('heading', { name: 'Chloe Bennett' })).toBeVisible();
		await expect(page.getByText('Direct conversation')).toBeVisible();

		await page.getByRole('button', { name: 'View conversation' }).click();

		await expect(page).toHaveURL(/\/messages$/);
		await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
		await expect(page.getByText('Chloe Bennett').first()).toBeVisible();
	});
});