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

	test('shows member review surfaces and clears a deletion request locally', async ({ page }) => {
		await page.goto('/organization?smoke=1');

		await page.getByLabel('Organization sections').getByRole('button', { name: 'Members' }).click();
		await expect(page.getByText('Deletion requests', { exact: true })).toBeVisible();
		await expect(page.getByText('Nico Park').first()).toBeVisible();

		await page.getByRole('button', { name: 'Mark reviewed' }).click();

		await expect(page.getByText('Deletion request reviewed')).toBeVisible();
		await expect(page.getByText('No pending deletion requests')).toBeVisible();
	});
});