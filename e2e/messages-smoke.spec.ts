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

	test('archives and mutes an active smoke conversation locally', async ({ page }) => {
		await page.goto('/messages?smoke=1');

		await page.getByRole('button', { name: /Elena Rossi/i }).first().click();
		await expect(page.getByRole('button', { name: 'Mute conversation' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Archive conversation' })).toBeVisible();

		await page.getByRole('button', { name: 'Mute conversation' }).click();
		await expect(page.getByRole('button', { name: 'Unmute conversation' })).toBeVisible();

		await page.getByRole('button', { name: 'Archive conversation' }).click();
		await expect(page.getByRole('button', { name: 'Restore conversation' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Elena Rossi/i })).toHaveCount(0);

		await page.getByRole('button', { name: 'Show archived' }).click();
		await expect(page.getByRole('button', { name: /Elena Rossi/i }).first()).toBeVisible();
	});

	test('reveals and restores an archived smoke conversation', async ({ page }) => {
		await page.goto('/messages?smoke=1');

		await expect(page.getByText('Yara Haddad').first()).toBeHidden();
		await page.getByRole('button', { name: 'Show archived' }).click();
		await expect(page.getByText('Yara Haddad').first()).toBeVisible();

		await page.getByRole('button', { name: /Yara Haddad/i }).first().click();
		await page.getByRole('button', { name: 'Restore conversation' }).click();
		await expect(page.getByText('Archived conversations stay out of inbox triage').first()).toBeHidden();

		await page.getByRole('button', { name: 'Hide archived' }).click();
		await expect(page.getByText('Yara Haddad').first()).toBeVisible();
	});

	test('unmutes a muted smoke conversation locally', async ({ page }) => {
		await page.goto('/messages?smoke=1');

		await page.getByText('Malik Johnson').first().click();
		await expect(page.getByRole('button', { name: 'Unmute conversation' })).toBeVisible();
		await page.getByRole('button', { name: 'Unmute conversation' }).click();
		await expect(page.getByRole('button', { name: 'Mute conversation' })).toBeVisible();
	});
});