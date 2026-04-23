import { expect, test } from '@playwright/test';

test.describe('organization smoke routes', () => {
	test('keeps join code and invitation review local in smoke mode', async ({ page }) => {
		await page.goto('/organization?smoke=1');

		await expect(page.getByText('Overview', { exact: true })).toBeVisible();
		await expect(page.getByText('Join code', { exact: true })).toBeVisible();
		await expect(page.getByText('Pending invitations', { exact: true })).toBeVisible();
		await expect(page.getByText('new.family@example.com')).toBeVisible();

		await page.getByRole('button', { name: 'Generate new code' }).click();
		await expect(page.getByText('Join code updated')).toBeVisible();

		await page.getByRole('button', { name: 'Revoke invitation for new.family@example.com' }).click();
		await expect(page.getByText('Revoke invitation?')).toBeVisible();
		await page.getByRole('button', { name: 'Revoke invitation' }).last().click();

		await expect(page.getByText('Invitation revoked')).toBeVisible();
		await expect(page.getByText('new.family@example.com')).not.toBeVisible();
	});

	test('recovers an expired invitation locally in smoke mode', async ({ page }) => {
		await page.goto('/organization?smoke=1');

		await page.getByRole('button', { name: 'Expired' }).click();
		await expect(page.getByText('+1 555 123 0099')).toBeVisible();

		const expiredRow = page.locator('tr').filter({ hasText: '+1 555 123 0099' });
		await expiredRow.getByRole('button', { name: 'Resend invitation to +1 555 123 0099' }).click();

		await expect(page.getByText('Resend invitation?')).toBeVisible();
		await page.getByRole('button', { name: 'Resend invitation' }).last().click();

		await expect(page.getByText('Invitation refreshed')).toBeVisible();
		await expect(page.getByText('No expired invitations')).toBeVisible();

		await page.getByRole('button', { name: 'All' }).click();
		const refreshedRow = page.locator('tr').filter({ hasText: '+1 555 123 0099' });
		await expect(refreshedRow).toBeVisible();
		await expect(refreshedRow.getByText('Pending')).toBeVisible();
		await expect(refreshedRow.getByText('Expired')).toHaveCount(0);
	});

	test('shows member review surfaces and clears a deletion request locally', async ({ page }) => {
		await page.goto('/organization?smoke=1');

		await page.getByLabel('Organization sections').getByRole('button', { name: 'Members' }).click();
		await expect(page.getByText('Deletion requests', { exact: true })).toBeVisible();
		await expect(page.getByText('Mason Reed').first()).toBeVisible();

		await page.getByRole('button', { name: 'Mark reviewed' }).click();

		await expect(page.getByText('Deletion request reviewed')).toBeVisible();
		await expect(page.getByText('No pending deletion requests')).toBeVisible();
	});
});