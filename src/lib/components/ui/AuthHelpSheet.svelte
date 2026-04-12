<script lang="ts">
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as Item from '$lib/components/ui/item';

	let {
		triggerLabel = 'Help',
		triggerClass = ''
	}: {
		triggerLabel?: string;
		triggerClass?: string;
	} = $props();
</script>

<Sheet.Root>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props} type="button" variant="outline" size="sm" class={`gap-2 ${triggerClass}`}>
				<CircleHelpIcon class="shell-header__control-icon" aria-hidden="true" />
				<span class="shell-header__control-label">{triggerLabel}</span>
			</Button>
		{/snippet}
	</Sheet.Trigger>

	<Sheet.Content side="right" class="w-[92vw] max-w-104 border-border bg-background">
		<Sheet.Header>
			<Sheet.Title>Sign-in help</Sheet.Title>
			<Sheet.Description>
				Choose the fastest way to access your organization and finish setup.
			</Sheet.Description>
		</Sheet.Header>

		<div class="space-y-3 px-5 py-4">
			<Item.Group>
				<Item.Root variant="default" class="bg-card">
					<Item.Content>
						<Item.Title>Use your phone for the quickest sign-in</Item.Title>
						<Item.Description>
							Enter your phone number and confirm the texted 6-digit code.
						</Item.Description>
					</Item.Content>
				</Item.Root>

				<Item.Root variant="default" class="bg-card">
					<Item.Content>
						<Item.Title>Email stays available for passwords and recovery</Item.Title>
						<Item.Description>
							Use email if you prefer a password-based sign-in or need a reset link.
						</Item.Description>
					</Item.Content>
				</Item.Root>

				<Item.Root variant="default" class="bg-card">
					<Item.Content>
						<Item.Title>First-time access continues into onboarding</Item.Title>
						<Item.Description>
							New accounts may be asked for a display name and organization setup after sign-in.
						</Item.Description>
					</Item.Content>
				</Item.Root>
			</Item.Group>
		</div>

		<Sheet.Footer>
			<Sheet.Close>
				{#snippet child({ props })}
					<Button {...props} type="button" variant="outline">Close</Button>
				{/snippet}
			</Sheet.Close>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>