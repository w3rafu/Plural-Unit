import { expect, test } from '@playwright/test';

test.describe('profile smoke routes', () => {
	test('updates the bio locally in smoke mode and shows the deletion pending state', async ({ page }) => {
		await page.goto('/profile?smoke=1');

		await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
		await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Hub alerts in the app' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Direct message push' })).toBeVisible();
		await expect(page.getByLabel('Bio')).toHaveValue(
			'Coordinates the Harbor Unit schedule and keeps volunteers aligned across weekly operations.'
		);

		const bioField = page.locator('#profile-bio');
		await bioField.fill('Smoke mode bio update for profile coverage.');
		await page.getByRole('button', { name: 'Save details' }).click();

		await expect(page.getByText('Profile updated')).toBeVisible();
		await expect(bioField).toHaveValue('Smoke mode bio update for profile coverage.');

		await page.getByRole('button', { name: 'Delete my account' }).click();
		await expect(page.getByText('Delete your account?')).toBeVisible();
		await page.getByRole('button', { name: 'Yes, delete my account' }).click();

		await expect(page.getByText('Deletion requested')).toBeVisible();
		await expect(page.getByText('Deletion request pending')).toBeVisible();
		await expect(page.getByText(/An admin still needs to review this request\./)).toBeVisible();
	});
});