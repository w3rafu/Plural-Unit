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
		await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
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

	test('navigates from the hub broadcast list into broadcast detail admin follow-up', async ({ page }) => {
		await page.goto('/?smoke=1');

		await expect(page.getByRole('heading', { name: 'Harbor Unit' })).toBeVisible();
		await page.getByRole('link', { name: 'Sunday hospitality reset' }).click();

		await expect(page).toHaveURL(/\/hub\/broadcast\/broadcast-1$/);
		await expect(
			page.locator('main').getByRole('heading', { name: 'Sunday hospitality reset' })
		).toBeVisible();
		await expect(page.getByText('Admin context')).toBeVisible();
		await expect(page.getByText('Acknowledgment follow-up', { exact: true })).toBeVisible();
		await expect(page.getByText('2 acknowledged, 6 pending on the current roster.')).toBeVisible();
		await expect(page.getByText('Natalie Quinn')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Open in manage' })).toBeVisible();
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

	test('loads manage sections with plugin controls and audience targeting', async ({ page }) => {
		await page.goto('/hub/manage/sections?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByText('Hub sections')).toBeVisible();
		await expect(page.getByRole('checkbox', { name: 'Broadcasts' })).toBeVisible();
		await expect(page.getByRole('checkbox', { name: 'Events' })).toBeVisible();
		await expect(
			page.getByRole('button', { name: 'Set Events visibility to admins only' })
		).toHaveAttribute('aria-pressed', 'true');

		const resourcesToggle = page.getByRole('checkbox', { name: 'Resources' });
		await expect(resourcesToggle).not.toBeChecked();
		await resourcesToggle.click();
		await expect(resourcesToggle).toBeChecked();

		const resourcesAdminsOnly = page.getByRole('button', {
			name: 'Set Resources visibility to admins only'
		});
		await expect(resourcesAdminsOnly).toHaveAttribute('aria-pressed', 'false');
		await resourcesAdminsOnly.click();
		await expect(resourcesAdminsOnly).toHaveAttribute('aria-pressed', 'true');
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

	test('navigates to a canceled event detail and shows lifecycle state', async ({ page }) => {
		await page.goto('/hub/event/smoke-event-canceled?smoke=1');

		await expect(page.locator('main').getByText('Spring gathering')).toBeVisible();
		await expect(page.getByText('Canceled')).toBeVisible();
		await expect(page.getByText(/Keep this link/)).toBeVisible();
		await expect(page.getByText('Responses are closed because this event was canceled.')).toBeVisible();
	});

	test('cancels a live event from manage and shows it in event history', async ({ page }) => {
		await page.goto('/hub/manage/content?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Event editor' })).toBeVisible();

		const eventEditor = page.getByRole('region', { name: 'Event editor' });
		const cancelButton = eventEditor.getByRole('button', { name: 'Cancel' }).first();
		await expect(cancelButton).toBeVisible();
		await cancelButton.click();

		await expect(eventEditor.getByText('Event history')).toBeVisible();
		await expect(eventEditor.getByText(/\d+ event(s)? in history\./)).toBeVisible();
	});

	test('restores a canceled event from manage event history', async ({ page }) => {
		await page.goto('/hub/manage/content?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		const eventEditor = page.getByRole('region', { name: 'Event editor' });

		await expect(eventEditor.getByText('Spring gathering')).toBeVisible();
		const restoreButton = eventEditor.getByRole('button', { name: 'Restore' }).first();
		await expect(restoreButton).toBeVisible();
		await restoreButton.click();

		await expect(eventEditor.getByText('Spring gathering')).toBeVisible();
	});

	test('loads manage content with resource editor and shows live resources with engagement signals', async ({ page }) => {
		await page.goto('/hub/manage/content?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		await expect(page.getByRole('region', { name: 'Resource editor' })).toBeVisible();

		const resourceEditor = page.getByRole('region', { name: 'Resource editor' });
		await expect(resourceEditor.getByText('Member handbook')).toBeVisible();
		await expect(resourceEditor.getByText('Volunteer interest form')).toBeVisible();
		await expect(resourceEditor.getByText('Upcoming schedule')).toBeVisible();

		await expect(resourceEditor.getByText('Active')).toBeVisible();
		await expect(resourceEditor.getByText('Unused')).toBeVisible();
		await expect(resourceEditor.getByText('Draft')).toBeVisible();
	});

	test('archives a live resource from manage and shows it in inactive history', async ({ page }) => {
		await page.goto('/hub/manage/content?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		const resourceEditor = page.getByRole('region', { name: 'Resource editor' });

		const archiveButton = resourceEditor.getByRole('button', { name: /Archive/ }).first();
		await expect(archiveButton).toBeVisible();
		await archiveButton.click();

		await expect(resourceEditor.getByText('Inactive history')).toBeVisible();
		await expect(resourceEditor.getByText(/\d+ draft or archived resource/)).toBeVisible();
	});

	test('restores an inactive resource from manage resource history', async ({ page }) => {
		await page.goto('/hub/manage/content?smoke=1');

		await expect(page.getByRole('heading', { name: 'Manage hub' })).toBeVisible();
		const resourceEditor = page.getByRole('region', { name: 'Resource editor' });

		const restoreButton = resourceEditor.getByRole('button', { name: 'Restore' }).first();
		await expect(restoreButton).toBeVisible();
		await restoreButton.click();

		await expect(resourceEditor.getByText('Live resources')).toBeVisible();
	});

	test('shows event reminder channel in admin detail for push-channel reminder event', async ({ page }) => {
		await page.goto('/?smoke=1');

		await page.getByRole('link', { name: 'Prayer breakfast' }).click();

		await expect(page).toHaveURL(/\/hub\/event\/event-3$/);
		await expect(page.getByText('Admin context')).toBeVisible();
		await expect(page.getByText(/via In-app alerts and push notifications/i)).toBeVisible();
	});
});