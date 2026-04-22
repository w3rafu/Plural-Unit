<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Field from '$lib/components/ui/field';
	import { currentHub } from '$lib/stores/currentHub.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import {
		isPushSupported,
		subscribeToPush,
		savePushSubscription,
		removePushSubscription,
		hasSavedPushSubscription
	} from '$lib/services/pushSubscription';
	import { triggerPushNotification } from '$lib/services/pushNotification';
	import { env } from '$env/dynamic/public';
	import { dev } from '$app/environment';

	let draftPreferences = $state<{ broadcast: boolean; event: boolean; message: boolean } | null>(null);
	let fieldError = $state('');
	let pushEnabled = $state(false);
	let pushSupported = $state(false);
	let pushBusy = $state(false);

	const organizationId = $derived(currentOrganization.organization?.id ?? '');
	const hasMembership = $derived(Boolean(currentOrganization.membership?.profile_id));
	const canManagePreferences = $derived(Boolean(organizationId) && hasMembership);
	const canEditPreferences = $derived(canManagePreferences && currentHub.hasLoadedForCurrentOrg);
	const isLoadingInitialState = $derived(currentHub.isLoading && !currentHub.hasLoadedForCurrentOrg);
	const resolvedPreferences = $derived(draftPreferences ?? currentHub.notificationPreferences);
	const devicePushAvailable = $derived(pushSupported && Boolean(env.PUBLIC_VAPID_KEY));
	const messagePreferenceDescription = $derived.by(() => {
		if (devicePushAvailable) {
			return 'Allow push notifications for new direct messages from this organization when push is enabled on this device.';
		}

		return 'Allow push notifications for new direct messages from this organization. Push delivery is not available on this device right now.';
	});

	onMount(() => {
		pushSupported = isPushSupported();
		if (pushSupported) {
			void hasSavedPushSubscription().then((saved) => {
				pushEnabled = saved;
			});
		}

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

	async function togglePush(enable: boolean) {
		if (pushBusy) return;
		pushBusy = true;

		try {
			if (enable) {
				const permission = await Notification.requestPermission();
				if (permission !== 'granted') {
					toast({ title: 'Permission denied', description: 'Enable notifications in your browser settings.', variant: 'error' });
					return;
				}

				const subscription = await subscribeToPush(env.PUBLIC_VAPID_KEY ?? '');
				if (subscription) {
					await savePushSubscription(subscription);
					pushEnabled = true;
					toast({
						title: 'Push enabled',
						description: 'This device can now receive push notifications for allowed channels.',
						variant: 'success'
					});
				}
			} else {
				await removePushSubscription();
				pushEnabled = false;
				toast({
					title: 'Push disabled',
					description: 'This device will no longer receive push notifications.',
					variant: 'success'
				});
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Could not update push settings.';
			toast({ title: 'Push error', description: msg, variant: 'error' });
		} finally {
			pushBusy = false;
		}
	}

	async function sendTestPush() {
		const orgId = currentOrganization.organization?.id;
		if (!orgId) return;
		try {
			await triggerPushNotification({
				kind: 'broadcast',
				organization_id: orgId,
				source_id: 'test',
				title: 'Test push notification',
				body: 'If you see this, push notifications are working!',
				url: '/profile'
			});
			toast({ title: 'Test sent', description: 'Check your device for the notification.', variant: 'success' });
		} catch {
			toast({ title: 'Test failed', description: 'Could not send test push.', variant: 'error' });
		}
	}

	async function savePreferences() {
		if (!canEditPreferences) {
			return;
		}

		fieldError = '';

		try {
			await currentHub.updateNotificationPreferences({
				broadcast: resolvedPreferences.broadcast,
				event: resolvedPreferences.event,
				message: resolvedPreferences.message
			});

			draftPreferences = null;
			toast({
				title: 'Notifications updated',
				description: 'Your notification settings for this organization were saved.',
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
		<Card.Title class="text-lg font-semibold tracking-tight">Notifications</Card.Title>
		<Card.Description>Choose what reaches you in the app and on this device.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4">
		{#if !canManagePreferences}
			<p class="text-sm text-muted-foreground">
				Join an organization to manage your notification settings.
			</p>
		{:else}
			<form
				class="space-y-4"
				onsubmit={(event) => {
					event.preventDefault();
					savePreferences();
				}}
			>
				<div class="space-y-4">
					<section class="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
						<div class="space-y-1">
							<h3 class="text-sm font-semibold text-foreground">In-app alerts</h3>
							<p class="text-xs text-muted-foreground">Show broadcasts and event updates in the app.</p>
						</div>

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
										Broadcasts
									</Field.Label>
									<Field.Description>
										Show live broadcast updates.
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
									<Field.Label for="notification-preferences-events">
										Events
									</Field.Label>
									<Field.Description>
										Show new events and reminders.
									</Field.Description>
								</Field.Content>
							</Field.Field>
						</Field.Group>
					</section>

					<section class="space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4 shadow-sm">
						<div class="space-y-1">
							<h3 class="text-sm font-semibold text-foreground">Direct message push</h3>
							<p class="text-xs text-muted-foreground">Allow push for new direct messages from this organization.</p>
						</div>

						<Field.Group class="gap-4">
							<Field.Field orientation="horizontal">
								<Checkbox
									id="notification-preferences-messages"
									checked={resolvedPreferences.message}
									disabled={!canEditPreferences || isLoadingInitialState}
									onCheckedChange={(nextChecked) => {
										draftPreferences = {
											...resolvedPreferences,
											message: Boolean(nextChecked)
										};
									}}
								/>
								<Field.Content>
									<Field.Label for="notification-preferences-messages">
										Direct messages
									</Field.Label>
									<Field.Description>
										{messagePreferenceDescription}
									</Field.Description>
								</Field.Content>
							</Field.Field>
						</Field.Group>
					</section>

					{#if fieldError}
						<Field.Error role="alert">{fieldError}</Field.Error>
					{/if}
				</div>

				<div class="flex flex-wrap items-center gap-3">
					<Button
						type="submit"
						disabled={!canEditPreferences || currentHub.isSavingNotificationPreferences || isLoadingInitialState}
					>
						{currentHub.isSavingNotificationPreferences ? 'Saving...' : 'Save settings'}
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
							? 'Loading your current notification settings...'
							: !currentHub.hasLoadedForCurrentOrg
								? 'Load your current organization settings before making changes.'
								: `Applies to ${currentOrganization.organization?.name ?? 'your organization'}. Device push is managed separately below.`}
					</p>
				</div>
			</form>

			{#if devicePushAvailable}
				<div class="space-y-3 border-t border-border/70 pt-4">
					<div class="space-y-1">
						<h3 class="text-sm font-semibold text-foreground">This device</h3>
						<p class="text-xs text-muted-foreground">
							Enable browser push on this device. Organization settings above still decide which alerts can be sent.
						</p>
					</div>

					<Field.Field orientation="horizontal">
						<Checkbox
							id="notification-preferences-push"
							checked={pushEnabled}
							disabled={pushBusy}
							onCheckedChange={(nextChecked) => {
								void togglePush(Boolean(nextChecked));
							}}
						/>
						<Field.Content>
							<Field.Label for="notification-preferences-push">Enable push on this device</Field.Label>
							<Field.Description>
								Allow this browser to receive push notifications when you're away from the app.
							</Field.Description>
						</Field.Content>
					</Field.Field>

					{#if dev && pushEnabled}
						<div class="pl-7">
							<Button type="button" variant="outline" size="sm" onclick={() => void sendTestPush()}>
								Send test push
							</Button>
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</Card.Content>
</Card.Root>