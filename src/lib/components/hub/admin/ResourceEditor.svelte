<!--
	ResourceEditor — admin form to create, edit, reorder, and delete resources.

	Rendered by the hub manage page when the `resources` plugin is active.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ArrowDown, ArrowUp, ExternalLink } from '@lucide/svelte';
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
	let feedback = $state('');
	const UNSAVED_CHANGES_KEY = 'hub-resource-editor';

	const editingResource = $derived(
		editingId ? currentHub.orderedResources.find((resource) => resource.id === editingId) ?? null : null
	);
	const initialResourceSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: editingResource?.title.trim() ?? '',
			description: editingResource?.description.trim() ?? '',
			href: editingResource?.href.trim() ?? '',
			resourceType: editingResource?.resource_type ?? 'link'
		})
	);
	const currentResourceSnapshot = $derived.by(() =>
		createDirtySnapshot({
			title: title.trim(),
			description: description.trim(),
			href: href.trim(),
			resourceType
		})
	);
	const isEditing = $derived(!!editingResource);
	const orderedResources = $derived(currentHub.orderedResources);
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
		feedback = '';
	}

	function startEditing(resource: ResourceRow) {
		editingId = resource.id;
		title = resource.title;
		description = resource.description;
		href = resource.href;
		resourceType = resource.resource_type;
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
					resource_type: resourceType
				});
			} else {
				await currentHub.addResource({
					title: title.trim(),
					description: description.trim(),
					href: normalizedHref,
					resource_type: resourceType
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
						<Item.Root variant="muted" size="sm">
							<Item.Content>
								<div class="flex flex-wrap items-center gap-2">
									<Item.Title>{resource.title}</Item.Title>
									<Badge variant="outline">{getResourceTypeLabel(resource.resource_type)}</Badge>
								</div>
								<Item.Description>
									{resource.description || 'No description added yet.'}
								</Item.Description>
								<p class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
									{getResourceDestinationLabel(resource.href)}
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
									variant="destructive"
									size="sm"
									onclick={() => remove(resource)}
									disabled={isResourceMutating}
								>
									{currentHub.resourceTargetId === resource.id ? 'Deleting...' : 'Delete'}
								</Button>
							</Item.Actions>
						</Item.Root>
					{/each}
				</Item.Group>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
