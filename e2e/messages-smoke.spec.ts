import { expect, test } from '@playwright/test';

test.describe('messages smoke routes', () => {
	test('sends and deletes a message locally in smoke mode', async ({ page }) => {
		await page.goto('/messages?smoke=1');

		await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
		await expect(page.getByText('Elena Rossi').first()).toBeVisible();

		await page.locator('textarea[placeholder="Write an update or reply..."]:visible').fill(
			'Smoke mode message for coverage.'
		);
		await page.locator('button[aria-label="Send message"]:visible').click();

		await expect(
			page.locator('p:visible').filter({ hasText: 'Smoke mode message for coverage.' }).first()
		).toBeVisible();

		await page.getByRole('button', { name: 'Delete' }).last().click();

		await expect(
			page.locator('p:visible').filter({ hasText: 'This message was deleted.' }).first()
		).toBeVisible();
	});
});