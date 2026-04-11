<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';

	type ConfirmVariant = 'default' | 'destructive';

	type Props = {
		open?: boolean;
		title: string;
		description: string;
		details?: string[];
		confirmLabel?: string;
		confirmBusyLabel?: string;
		cancelLabel?: string;
		confirmVariant?: ConfirmVariant;
		isSubmitting?: boolean;
		onConfirm?: () => void | Promise<void>;
		onCancel?: () => void;
	};

	let {
		open = $bindable(false),
		title,
		description,
		details = [],
		confirmLabel = 'Confirm',
		confirmBusyLabel = 'Working...',
		cancelLabel = 'Cancel',
		confirmVariant = 'default',
		isSubmitting = false,
		onConfirm,
		onCancel
	}: Props = $props();

	let wasOpen = false;

	$effect(() => {
		if (wasOpen && !open) {
			onCancel?.();
		}

		wasOpen = open;
	});

	async function handleConfirm() {
		await onConfirm?.();
	}

	function handleCancel() {
		open = false;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="right"
		class="w-full max-w-md border-border/70 bg-background/98 backdrop-blur-sm"
	>
		<Sheet.Header class="gap-2 border-border/70">
			<Sheet.Title class="text-lg font-semibold tracking-tight text-foreground">
				{title}
			</Sheet.Title>
			<Sheet.Description class="text-sm leading-6 text-muted-foreground">
				{description}
			</Sheet.Description>
		</Sheet.Header>

		{#if details.length > 0}
			<div class="px-5 py-4">
				<div class="space-y-2 rounded-xl border border-border/70 bg-muted/25 px-4 py-3">
					{#each details as detail (detail)}
						<p class="text-sm leading-6 text-muted-foreground">{detail}</p>
					{/each}
				</div>
			</div>
		{/if}

		<Sheet.Footer class="border-border/70 max-sm:flex-col-reverse max-sm:items-stretch">
			<Button type="button" variant="outline" disabled={isSubmitting} onclick={handleCancel}>
				{cancelLabel}
			</Button>
			<Button type="button" variant={confirmVariant} disabled={isSubmitting} onclick={handleConfirm}>
				{isSubmitting ? confirmBusyLabel : confirmLabel}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
