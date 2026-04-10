<script lang="ts">
	import { X } from '@lucide/svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { cn } from '$lib/utils';
</script>

{#if toastStore.toasts.length > 0}
	<div
		class="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-3 sm:inset-x-auto sm:right-4 sm:w-full sm:max-w-sm"
		aria-live="polite"
		aria-atomic="true"
	>
		{#each toastStore.toasts as item (item.id)}
			<div
				class={cn(
					'pointer-events-auto w-full overflow-hidden rounded-xl border bg-card/95 shadow-[0_18px_44px_rgba(15,23,42,0.14)] backdrop-blur-md transition-all',
					item.variant === 'success' && 'border-border/70',
					item.variant === 'default' && 'border-border/70',
					item.variant === 'error' && 'border-destructive/30 bg-destructive/10'
				)}
				role={item.variant === 'error' ? 'alert' : 'status'}
			>
				<div class="flex items-start gap-3 px-4 py-3">
					<div class="min-w-0 flex-1 space-y-1">
						<p
							class={cn(
								'text-sm font-medium text-foreground',
								item.variant === 'error' && 'text-destructive'
							)}
						>
							{item.title}
						</p>
						{#if item.description}
							<p
								class={cn(
									'text-sm text-muted-foreground',
									item.variant === 'error' && 'text-destructive/80'
								)}
							>
								{item.description}
							</p>
						{/if}
					</div>

					<button
						type="button"
						class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						onclick={() => toastStore.dismiss(item.id)}
						aria-label="Dismiss notification"
					>
						<X class="size-4" />
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}
