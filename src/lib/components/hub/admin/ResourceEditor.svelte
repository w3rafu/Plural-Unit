<!--
	ResourceEditor — admin form to create, edit, reorder, and delete resources.

	Rendered by the hub manage page when the `resources` plugin is active.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Archive, ArrowDown, ArrowUp, ExternalLink, RotateCcw, Trash2 } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import { Input } from '$lib/components/ui/input';
	import * as Item from '$lib/components/ui/item';
	import {
		HUB_RESOURCE_TYPE_OPTIONS,
		getResourceActionLabel,
		getResourceDestinationLabel,
		getResourceEngagementSignal,
		getResourceLifecycleLabel,
		getResourceTypeLabel,
		validateResourceHref
	} from '$lib/models/resourcesModel';
	import { createDirtySnapshot } from '$lib/models/unsavedChanges';
	import type { ResourceRow, ResourceType } from '$lib/repositories/hubRepository';
	import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { currentHub } from '$lib/stores/currentHub.svelte';

	let editingId = $state<string | null>(null);
	let title = $state('');
	let description = $state('');
	let href = $state('');
	let resourceType = $state<ResourceType>('link');
	let resourceStatus = $state<'live' | 'draft'>('live');
	let feedback = $state('');
	const UNSAVED_CHANGES_KEY = 'hub-resource-editor';

	const editingResource = $derived(
		editingId ? currentHub.resources.find((resource) => resource.id === editingId) ?? null : null
	);
	const initialResourceSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: editingResource?.title.trim() ?? '',
			description: editingResource?.description.trim() ?? '',
			href: editingResource?.href.trim() ?? '',
			resourceType: editingResource?.resource_type ?? 'link',
			resourceStatus: editingResource?.is_draft ? 'draft' : 'live'
		})
	);
	const currentResourceSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: title.trim(),
			description: description.trim(),
			href: href.trim(),
			resourceType,
			resourceStatus
		})
	);
	const isEditing = $derived(!!editingResource);
	const orderedResources = $derived(currentHub.orderedResources);
	const inactiveResources = $derived(currentHub.inactiveResources);
	const isResourceDirty = $derived(currentResourceSnapshot !== initialResourceSnapshot);
	const isResourceMutating = $derived(currentHub.resourceTargetId !== '');
	const resourceMutationStatus = $derived.by(() => {
		if (!isResourceMutating) {
			return '';
		}

		if (currentHub.resourceTargetId === 'draft') {
			return isEditing ? 'Saving resource changes...' : 'Saving resource...';
		}

		if (editingId && currentHub.resourceTargetId === editingId) {
			return 'Saving changes to this resource...';
		}

		return 'Updating resource list...';
	});
	const hrefDescription = $derived.by(() => {
		switch (resourceType) {
			case 'form':
				return 'Link directly to the signup or response form members should complete.';
			case 'document':
				return 'Link to the document, guide, or reference file members should review.';
			case 'contact':
				return 'Use an email, phone number, or full contact page link.';
			default:
				return 'Use a full link, or a domain we can normalize for members.';
		}
	});
	const hrefPlaceholder = $derived.by(() => {
		switch (resourceType) {
			case 'form':
				return 'forms.gle/your-form';
			case 'document':
				return 'drive.google.com/...';
			case 'contact':
				return 'person@example.com or +1 555 0100';
			default:
				return 'example.com/resource';
		}
	});

	$effect(() => {
		unsavedChanges.set(
			UNSAVED_CHANGES_KEY,
			isEditing ? 'resource edits' : 'resource draft',
			isResourceDirty
		);
	});

	onDestroy(() => {
		unsavedChanges.clear(UNSAVED_CHANGES_KEY);
	});

	function resetForm() {
		editingId = null;
		title = '';
		description = '';
		href = '';
		resourceType = 'link';
		resourceStatus = 'live';
		feedback = '';
	}

	function startEditing(resource: ResourceRow) {
		editingId = resource.id;
		title = resource.title;
		description = resource.description;
		href = resource.href;
		resourceType = resource.resource_type;
		resourceStatus = resource.is_draft ? 'draft' : 'live';
		feedback = '';
	}

	async function submit() {
		feedback = '';
		if (!title.trim()) {
			feedback = 'Enter a title.';
			return;
		}

		try {
			const normalizedHref = validateResourceHref(href, resourceType);

			if (editingId) {
				await currentHub.updateResource(editingId, {
					title: title.trim(),
					description: description.trim(),
					href: normalizedHref,
					resource_type: resourceType,
					is_draft: resourceStatus === 'draft'
				});
			} else {
				await currentHub.addResource({
					title: title.trim(),
					description: description.trim(),
					href: normalizedHref,
					resource_type: resourceType,
					is_draft: resourceStatus === 'draft'
				});
			}

			resetForm();
		} catch (error) {
			feedback = error instanceof Error ? error.message : 'Failed to save the resource.';
		}
	}

	async function move(resource: ResourceRow, direction: 'up' | 'down') {
		try {
			await currentHub.moveResource(resource.id, direction);
		} catch (error) {
			feedback = error instanceof Error ? error.message : 'Failed to reorder the resource.';
		}
	}

	async function remove(resource: ResourceRow) {
		try {
			await currentHub.removeResource(resource.id);
			if (editingId === resource.id) {
				resetForm();
			}
		} catch (error) {
			feedback = error instanceof Error ? error.message : 'Failed to delete the resource.';
		}
	}

	async function archive(resource: ResourceRow) {
		try {
			await currentHub.archiveResource(resource.id);
			if (editingId === resource.id) {
				resetForm();
			}
		} catch (error) {
			feedback = error instanceof Error ? error.message : 'Failed to archive the resource.';
		}
	}

	async function restore(resource: ResourceRow) {
		try {
			await currentHub.restoreResource(resource.id);
			if (editingId === resource.id) {
				resetForm();
			}
		} catch (error) {
			feedback = error instanceof Error ? error.message : 'Failed to restore the resource.';
		}
	}
</script>

<Card.Root class="border-border/70 bg-card">
	<Card.Header class="gap-2 border-b border-border/70">
		<Card.Title class="text-lg font-semibold tracking-tight">Resources</Card.Title>
		<Card.Description>Save the stable links and references members reopen most often.</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-6" aria-busy={isResourceMutating}>
		<form
			class="space-y-5"
			onsubmit={(event) => {
				event.preventDefault();
				submit();
			}}
		>
			<Field.Set disabled={isResourceMutating}>
				<Field.Group class="gap-4">
					<Field.Field>
						<Field.Content>
							<Field.Label for="resource-title">Title</Field.Label>
							<Field.Description>Keep it specific so members know exactly what will open.</Field.Description>
							<Input id="resource-title" type="text" bind:value={title} disabled={isResourceMutating} />
						</Field.Content>
					</Field.Field>

					<Field.Field>
						<Field.Content>
							<Field.Label for="resource-type">Type</Field.Label>
							<Field.Description>Choose the kind of resource members should expect.</Field.Description>
							<Select.Root type="single" bind:value={resourceType} name="resourceType" disabled={isResourceMutating}>
								<Select.Trigger id="resource-type" disabled={isResourceMutating}>
									{getResourceTypeLabel(resourceType)}
								</Select.Trigger>
								<Select.Content>
									{#each HUB_RESOURCE_TYPE_OPTIONS as option (option.value)}
										<Select.Item value={option.value}>{option.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Content>
					</Field.Field>

					<Field.Field>
						<Field.Content>
							<Field.Label for="resource-status">Visibility</Field.Label>
							<Field.Description>Live resources are visible right away. Drafts stay in admin history until you restore them.</Field.Description>
							<Select.Root type="single" bind:value={resourceStatus} name="resourceStatus" disabled={isResourceMutating}>
								<Select.Trigger id="resource-status" disabled={isResourceMutating}>
									{resourceStatus === 'draft' ? 'Save as draft' : 'Live now'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="live">Live now</Select.Item>
									<Select.Item value="draft">Save as draft</Select.Item>
								</Select.Content>
							</Select.Root>
						</Field.Content>
					</Field.Field>

					<Field.Field>
						<Field.Content>
							<Field.Label for="resource-href">Destination</Field.Label>
							<Field.Description>{hrefDescription}</Field.Description>
							<Input
								id="resource-href"
								type="text"
								placeholder={hrefPlaceholder}
								bind:value={href}
								disabled={isResourceMutating}
							/>
						</Field.Content>
					</Field.Field>

					<Field.Field>
						<Field.Content>
							<Field.Label for="resource-description">Description</Field.Label>
							<Field.Description>Optional context that helps members decide when to use it.</Field.Description>
							<Textarea id="resource-description" bind:value={description} disabled={isResourceMutating} />
						</Field.Content>
					</Field.Field>
				</Field.Group>
			</Field.Set>

			<div class="flex flex-wrap justify-start gap-2">
				<Button type="submit" disabled={isResourceMutating}>
					{isEditing ? 'Save changes' : 'Add resource'}
				</Button>
				{#if isEditing}
					<Button type="button" variant="ghost" onclick={resetForm} disabled={isResourceMutating}>
						Cancel
					</Button>
				{/if}
			</div>
		</form>

		{#if isResourceMutating}
			<p
				role="status"
				aria-live="polite"
				class="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
			>
				{resourceMutationStatus}
			</p>
		{/if}

		{#if feedback}
			<p
				role="alert"
				class="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
			>
				{feedback}
			</p>
		{/if}

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Live resources</h3>
				<p class="text-sm text-muted-foreground">
					{orderedResources.length === 0
						? 'No resources are live yet.'
						: `${orderedResources.length} resource${orderedResources.length === 1 ? '' : 's'} currently visible to members.`}
				</p>
			</div>

			{#if orderedResources.length === 0}
				<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
					<Card.Content>
						<p class="text-sm text-muted-foreground">Add the first shared resource when you are ready.</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Item.Group aria-busy={isResourceMutating}>
					{#each orderedResources as resource, index (resource.id)}
						{@const engagement = getResourceEngagementSignal(resource)}
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{resource.title}</Item.Title>
									<Badge variant="outline">{getResourceTypeLabel(resource.resource_type)}</Badge>
									<Badge variant={engagement.needsAttention ? 'secondary' : 'outline'}>
										{engagement.label}
									</Badge>
								</div>
								<Item.Description>
									{resource.description || 'No description added yet.'}
								</Item.Description>
								<p class="text-[0.82rem] uppercase tracking-[0.12em] text-muted-foreground">
									{getResourceDestinationLabel(resource.href)}
								</p>
								<p class={`text-[0.82rem] ${engagement.needsAttention ? 'text-foreground' : 'text-muted-foreground'}`}>
									{engagement.copy}
								</p>
							</Item.Content>
							<Item.Actions>
								<Button
									variant="ghost"
									size="icon-xs"
									aria-label={`Move ${resource.title} up`}
									disabled={isResourceMutating || index === 0}
									onclick={() => move(resource, 'up')}
								>
									<ArrowUp class="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon-xs"
									aria-label={`Move ${resource.title} down`}
									disabled={isResourceMutating || index === orderedResources.length - 1}
									onclick={() => move(resource, 'down')}
								>
									<ArrowDown class="size-3.5" />
								</Button>
								<Button variant="ghost" size="sm" onclick={() => startEditing(resource)} disabled={isResourceMutating}>
									Edit
								</Button>
								<Button
									href={resource.href}
									variant="outline"
									size="sm"
									target="_blank"
									rel="noreferrer"
									disabled={isResourceMutating}
								>
									{getResourceActionLabel(resource.resource_type)}
									<ExternalLink class="size-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onclick={() => archive(resource)}
									disabled={isResourceMutating}
								>
									<Archive class="size-4" />
									Archive
								</Button>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</div>

		<div class="space-y-3">
			<div class="space-y-1">
				<h3 class="text-sm font-semibold tracking-tight text-foreground">Inactive history</h3>
				<p class="text-sm text-muted-foreground">
					{inactiveResources.length === 0
						? 'No drafts or archived resources yet.'
						: `${inactiveResources.length} draft or archived resource${inactiveResources.length === 1 ? '' : 's'} ready for review.`}
				</p>
			</div>

			{#if inactiveResources.length === 0}
				<Card.Root size="sm" class="border-dashed border-border/70 bg-muted/20">
					<Card.Content>
						<p class="text-sm text-muted-foreground">
							Drafts and archived resources will collect here for restore or cleanup.
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Item.Group aria-busy={isResourceMutating}>
					{#each inactiveResources as resource (resource.id)}
						{@const engagement = getResourceEngagementSignal(resource)}
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{resource.title}</Item.Title>
									<Badge variant="outline">{getResourceTypeLabel(resource.resource_type)}</Badge>
									<Badge variant="secondary">{getResourceLifecycleLabel(resource)}</Badge>
									<Badge variant={engagement.needsAttention ? 'secondary' : 'outline'}>
										{engagement.label}
									</Badge>
								</div>
								<Item.Description>
									{resource.description || 'No description added yet.'}
								</Item.Description>
								<p class="text-[0.82rem] uppercase tracking-[0.12em] text-muted-foreground">
									{getResourceDestinationLabel(resource.href)}
								</p>
								<p class={`text-[0.82rem] ${engagement.needsAttention ? 'text-foreground' : 'text-muted-foreground'}`}>
									{engagement.copy}
								</p>
							</Item.Content>
							<Item.Actions>
								<Button variant="ghost" size="sm" onclick={() => startEditing(resource)} disabled={isResourceMutating}>
									Edit
								</Button>
								<Button
									href={resource.href}
									variant="outline"
									size="sm"
									target="_blank"
									rel="noreferrer"
									disabled={isResourceMutating}
								>
									{getResourceActionLabel(resource.resource_type)}
									<ExternalLink class="size-4" />
								</Button>
								<Button variant="outline" size="sm" onclick={() => restore(resource)} disabled={isResourceMutating}>
									<RotateCcw class="size-4" />
									Restore
								</Button>
								<Button variant="destructive" size="sm" onclick={() => remove(resource)} disabled={isResourceMutating}>
									<Trash2 class="size-4" />
									Delete
								</Button>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
