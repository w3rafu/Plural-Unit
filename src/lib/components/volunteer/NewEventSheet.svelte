<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	let open = $state(false);
	let shiftCount = $state(1);
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline" size="sm" class="h-8 rounded-full px-3 text-[0.78rem] font-medium">New Event</Button>
		{/snippet}
	</Sheet.Trigger>
	<Sheet.Content side="right" class="w-full max-w-md overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>New Volunteer Event</Sheet.Title>
			<Sheet.Description>Fill in the details and add shifts. You can clone a past event to start faster.</Sheet.Description>
		</Sheet.Header>

		<div class="mt-6 flex flex-col gap-5">
			<div class="flex flex-col gap-1.5">
				<Label for="event-name">Event name</Label>
				<Input id="event-name" placeholder="e.g. Summer Festival 2026" />
			</div>

			<div class="grid grid-cols-2 gap-3">
				<div class="flex flex-col gap-1.5">
					<Label for="event-date">Date</Label>
					<Input id="event-date" type="date" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="event-time">Start time</Label>
					<Input id="event-time" type="time" />
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<Label for="event-location">Location</Label>
				<Input id="event-location" placeholder="e.g. Riverside Park, Pavilion A" />
			</div>

			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium text-foreground">Shifts</p>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onclick={() => shiftCount++}
					>
						+ Add shift
					</Button>
				</div>

				{#each { length: shiftCount } as _, i (i)}
					<div class="rounded-lg border border-border/70 bg-muted/20 p-3">
						<div class="flex flex-col gap-2">
							<Input placeholder="Shift name, e.g. Beer Garden" />
							<div class="grid grid-cols-3 gap-2">
								<Input type="time" placeholder="Start" />
								<Input type="time" placeholder="End" />
								<Input type="number" placeholder="# needed" min="1" />
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="mt-6 flex flex-col gap-2 border-t border-border/70 pt-4">
			<Button type="button" onclick={() => (open = false)}>Create Event</Button>
			<Button type="button" variant="ghost" onclick={() => (open = false)}>Cancel</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
