<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Field from '$lib/components/ui/field';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let draftPreferences = $state<{ broadcast: boolean; event: boolean } | null>(null);
	let fieldError = $state('');

	const organizationId = $derived(currentOrganization.organization?.id ?? '');
	const hasMembership = $derived(Boolean(currentOrganization.membership?.profile_id));
	const canManagePreferences = $derived(Boolean(organizationId) && hasMembership);
	const canEditPreferences = $derived(canManagePreferences && currentHub.hasLoadedForCurrentOrg);
	const isLoadingInitialState = $derived(currentHub.isLoading && !currentHub.hasLoadedForCurrentOrg);
	const resolvedPreferences = $derived(draftPreferences ?? currentHub.notificationPreferences);

	onMount(() => {
		if (organizationId && hasMembership && !currentHub.hasLoadedForCurrentOrg && !currentHub.isLoading) {
			void loadNotificationSettings();
		}
	});

	function getErrorMessage(error: unknown, fallback: string) {
		return error instanceof Error ? error.message : fallback;
	}

	async function loadNotificationSettings() {
		fieldError = '';

		try {
			await currentHub.load();
		} catch (error) {
			fieldError = getErrorMessage(error, 'Could not load notification settings.');
		}
	}

	function retryLoad() {
		void loadNotificationSettings();
	}

	async function savePreferences() {
		if (!canEditPreferences) {
			return;
		}

		fieldError = '';

		try {
			await currentHub.updateNotificationPreferences({
				broadcast: resolvedPreferences.broadcast,
				event: resolvedPreferences.event
			});

			draftPreferences = null;
			toast({
				title: 'Notifications updated',
				description: 'Your in-app alert preferences were saved.',
				variant: 'success'
			});
		} catch (error) {
			fieldError = getErrorMessage(error, 'Could not save notification settings.');
			toast({
				title: 'Could not save notifications',
				description: fieldError,
				variant: 'error'
			});
		}
	}
</script>

<Card.Root id="notification-preferences" size="sm" class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">In-app alerts</Card.Title>
		<Card.Description>
			Choose which hub updates stay in your alert tray. This only changes in-app alerts for the current organization.
		</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4">
		{#if !canManagePreferences}
			<p class="text-sm text-muted-foreground">
				Join an organization to manage your in-app alert preferences.
			</p>
		{:else}
			<form
				class="space-y-4"
				onsubmit={(event) => {
					event.preventDefault();
					savePreferences();
				}}
			>
				<Field.Group class="gap-4">
					<Field.Field orientation="horizontal">
						<Checkbox
							id="notification-preferences-broadcasts"
							checked={resolvedPreferences.broadcast}
							disabled={!canEditPreferences || isLoadingInitialState}
							onCheckedChange={(nextChecked) => {
								draftPreferences = {
									...resolvedPreferences,
									broadcast: Boolean(nextChecked)
								};
							}}
						/>
						<Field.Content>
							<Field.Label for="notification-preferences-broadcasts">
								Broadcast alerts
							</Field.Label>
							<Field.Description>
								Show live broadcast updates in your alert tray and activity surfaces.
							</Field.Description>
						</Field.Content>
					</Field.Field>

					<Field.Field orientation="horizontal">
						<Checkbox
							id="notification-preferences-events"
							checked={resolvedPreferences.event}
							disabled={!canEditPreferences || isLoadingInitialState}
							onCheckedChange={(nextChecked) => {
								draftPreferences = {
									...resolvedPreferences,
									event: Boolean(nextChecked)
								};
							}}
						/>
						<Field.Content>
							<Field.Label for="notification-preferences-events">Event alerts</Field.Label>
							<Field.Description>
								Show newly published events and live event updates in your alert tray.
							</Field.Description>
						</Field.Content>
					</Field.Field>

					{#if fieldError}
						<Field.Error role="alert">{fieldError}</Field.Error>
					{/if}
				</Field.Group>

				<div class="flex flex-wrap items-center gap-3">
					<Button
						type="submit"
						disabled={!canEditPreferences || currentHub.isSavingNotificationPreferences || isLoadingInitialState}
					>
						{currentHub.isSavingNotificationPreferences ? 'Saving...' : 'Save preferences'}
					</Button>
					{#if !currentHub.hasLoadedForCurrentOrg && !isLoadingInitialState}
						<Button type="button" variant="outline" size="sm" onclick={retryLoad}>
							Load settings
						</Button>
					{/if}
					{#if fieldError && !currentHub.hasLoadedForCurrentOrg}
						<Button type="button" variant="ghost" size="sm" onclick={retryLoad}>
							Retry load
						</Button>
					{/if}
					<p class="text-xs text-muted-foreground">
						{isLoadingInitialState
							? 'Loading your current alert settings...'
							: !currentHub.hasLoadedForCurrentOrg
								? 'Load your current alert settings before making changes.'
							: `Applies only to ${currentOrganization.organization?.name ?? 'your organization'} in-app alerts.`}
					</p>
				</div>
			</form>
		{/if}
	</Card.Content>
</Card.Root>