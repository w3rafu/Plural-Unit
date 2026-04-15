import { expect, test } from '@playwright/test';

const staleHubSchemaRecoveryCopy =
	'Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.';

test.describe('hub smoke routes', () => {
	test('loads home, filters alerts, marks them read, and reaches profile alert preferences', async ({ page }) => {
		await page.goto('/?smoke=1');

		await expect(page.getByRole('heading', { name: 'Harbor Unit' })).toBeVisible();
		await expect(page.getByText('Members', { exact: true })).toBeVisible();

		await page.getByRole('button', { name: /^alerts/i }).click();
		await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
		const eventsFilter = page.getByRole('button', { name: /^Events / });
		await eventsFilter.click();
		await expect(eventsFilter).toHaveAttribute('aria-pressed', 'true');

		const markVisibleReadButton = page.getByRole('button', { name: 'Mark visible read' });
		await expect(markVisibleReadButton).toBeEnabled();
		await markVisibleReadButton.click();
		await expect(markVisibleReadButton).toBeDisabled();
		await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();

		await page.getByRole('link', { name: 'Settings' }).click();

		await expect(page).toHaveURL(/\/profile\/details#notification-preferences$/);
		await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
		await expect(page.getByText('In-app alerts', { exact: true })).toBeVisible();
	});

	test('loads manage content and exercises attendance plus queue triage', async ({ page }) => {
		await page.goto('/hub/manage/content?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByText('Operations queue')).toBeVisible();
		await expect(page.getByRole('region', { name: 'Broadcast editor' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Event editor' })).toBeVisible();
		await expect(page.getByText('Execution context').first()).toBeVisible();

		await page.getByRole('button', { name: /Mark all \d+ attended/i }).click();
		await expect(page.getByText(/Closeout complete for 2 expected attendees\./).first()).toBeVisible();

		await page.getByRole('button', { name: 'Reviewed' }).first().click();
		await expect(page.getByRole('button', { name: /Show triaged \(1\)/ })).toBeVisible();
		await page.getByRole('button', { name: /Show triaged \(1\)/ }).click();
		await expect(page.getByRole('button', { name: 'Surface again' }).first()).toBeVisible();
	});

	test('loads manage sections with plugin controls and toggles one section', async ({ page }) => {
		await page.goto('/hub/manage/sections?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByText('Hub sections')).toBeVisible();
		await expect(page.getByLabel('Broadcasts')).toBeVisible();
		await expect(page.getByLabel('Events')).toBeVisible();

		const resourcesToggle = page.getByRole('checkbox', { name: 'Resources' });
		await expect(resourcesToggle).not.toBeChecked();
		await resourcesToggle.click();
		await expect(resourcesToggle).toBeChecked();
	});

	test('surfaces stale-schema recovery guidance in smoke mode', async ({ page }) => {
		await page.goto('/?smoke=1&smokeScenario=stale-hub-schema');

		await expect(page.getByRole('heading', { name: 'Harbor Unit' })).toBeVisible();
		await expect(page.getByText('Could not load the hub')).toBeVisible();
		await expect(page.getByRole('alert').first()).toContainText(staleHubSchemaRecoveryCopy);

		await page.getByRole('button', { name: /^alerts/i }).click();
		await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
		await expect(page.getByRole('alert').last()).toContainText(staleHubSchemaRecoveryCopy);

		await page.goto('/hub/manage/content?smoke=1&smokeScenario=stale-hub-schema');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByText('Could not load hub tools')).toBeVisible();
		await expect(page.getByRole('alert').first()).toContainText(staleHubSchemaRecoveryCopy);
	});
});