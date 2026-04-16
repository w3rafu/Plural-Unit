import { expect, test } from '@playwright/test';

const staleHubSchemaRecoveryCopy =
	'Apply the 0.1.29 hub delivery migrations (021 through 027), then try again.';
const staleWorkflowSchemaRecoveryCopy =
	'Apply 029_create_hub_operator_workflow_state.sql, then try again.';

test.describe('hub smoke routes', () => {
	test('loads home, filters alerts, marks them read, and reaches profile alert preferences', async ({ page }) => {
		await page.goto('/?smoke=1');

		await expect(page.getByRole('heading', { name: 'Harbor Unit' })).toBeVisible();
		await expect(page.getByRole('button', { name: /^alerts/i })).toBeVisible();

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

		await expect(page).toHaveURL(/\/profile#notification-preferences$/);
		await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
		await expect(page.getByText('In-app alerts', { exact: true })).toBeVisible();
	});

	test('navigates from the hub event list into event detail admin context', async ({ page }) => {
		await page.goto('/?smoke=1');

		await expect(page.getByRole('heading', { name: 'Harbor Unit' })).toBeVisible();
		await page.getByRole('link', { name: 'Prayer breakfast' }).click();

		await expect(page).toHaveURL(/\/hub\/event\/event-3$/);
		await expect(page.locator('main').getByRole('heading', { name: 'Prayer breakfast' })).toBeVisible();
		await expect(page.getByText('Admin context')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Open in manage' })).toBeVisible();
		await expect(page.getByText('RSVP follow-up')).toBeVisible();
	});

	test('loads manage content and exercises attendance plus workflow queue state', async ({ page }) => {
		await page.goto('/hub/manage/content?smoke=1');
		const operationsQueue = page.getByLabel('Operations queue');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByText('Operations queue')).toBeVisible();
		await expect(page.getByRole('region', { name: 'Broadcast editor' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Event editor' })).toBeVisible();
		await expect(page.getByText('Execution context').first()).toBeVisible();

		await page.getByRole('button', { name: /Mark all \d+ attended/i }).click();
		await expect(page.getByText(/Closeout complete for 2 expected attendees\./).first()).toBeVisible();

		await expect(operationsQueue.getByText('Due time changed since review.')).toBeVisible();
		await expect(
			operationsQueue.getByText('Re-open this if the schedule shifts again.')
		).toBeVisible();
		await expect(
			operationsQueue.getByRole('button', { name: /Show triaged \(1\)/ })
		).toBeVisible();
		await operationsQueue.getByRole('button', { name: 'Reviewed' }).first().click();
		await expect(
			operationsQueue.getByRole('button', { name: /Show triaged \(2\)/ })
		).toBeVisible();
		await operationsQueue.getByRole('button', { name: /Show triaged \(2\)/ }).click();
		await expect(
			operationsQueue.getByText('Confirmed after the publish run completed.')
		).toBeVisible();
		await expect(
			operationsQueue.getByText(/Reviewed by You/i)
		).toBeVisible();
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

	test('surfaces workflow-schema recovery guidance in smoke mode', async ({ page }) => {
		await page.goto('/?smoke=1&smokeScenario=stale-workflow-schema');

		await expect(page.getByRole('heading', { name: 'Harbor Unit' })).toBeVisible();
		await expect(page.getByText('Could not load the hub')).toBeVisible();
		await expect(page.getByRole('alert').first()).toContainText(staleWorkflowSchemaRecoveryCopy);

		await page.getByRole('button', { name: /^alerts/i }).click();
		await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
		await expect(page.getByRole('alert').last()).toContainText(staleWorkflowSchemaRecoveryCopy);

		await page.goto('/hub/manage/content?smoke=1&smokeScenario=stale-workflow-schema');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByText('Could not load hub tools')).toBeVisible();
		await expect(page.getByRole('alert').first()).toContainText(staleWorkflowSchemaRecoveryCopy);
	});
});