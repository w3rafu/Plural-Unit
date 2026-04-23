<script lang="ts">
	import ActivityDotGrid from '$lib/components/ui/ActivityDotGrid.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import type { MessageThread } from '$lib/models/messageModel';
	import {
		getParticipantInitials,
		getThreadLastMessageSentAt,
		getThreadPreview,
		isThreadArchived,
		isThreadMuted
	} from '$lib/models/messageModel';
	import { formatThreadTimestamp } from './messageUi';

	let {
		thread,
		threads,
		onSelectThread
	}: {
		thread: MessageThread;
		threads: MessageThread[];
		onSelectThread: (threadId: string) => void;
	} = $props();

	const initials = $derived(getParticipantInitials(thread.participant.name));
	const lastUpdatedLabel = $derived(
		formatThreadTimestamp(getThreadLastMessageSentAt(thread)) || 'now'
	);
	const latestPreview = $derived(getThreadPreview(thread));
	const archived = $derived(isThreadArchived(thread));
	const muted = $derived(isThreadMuted(thread));
	const contactReplyCount = $derived(
		thread.messages.filter((message) => message.senderKind === 'contact' && !message.isDeleted).length
	);
	const ownerReplyCount = $derived(
		thread.messages.filter((message) => message.senderKind === 'owner' && !message.isDeleted).length
	);
	const totalMessageCount = $derived(thread.messages.filter((message) => !message.isDeleted).length);

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	const replyCadenceValues = $derived.by(() => {
		const recentMessages = thread.messages.filter((message) => !message.isDeleted);
		if (recentMessages.length === 0) {
			return Array.from({ length: 28 }, () => 0);
		}

		const timestamps = recentMessages
			.map((message) => Date.parse(message.sentAt))
			.filter((value) => Number.isFinite(value));
		const latestTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
		const buckets = Array.from({ length: 28 }, () => 0);

		for (const message of recentMessages) {
			const sentAt = Date.parse(message.sentAt);
			if (!Number.isFinite(sentAt)) continue;
			const diffDays = Math.floor((latestTimestamp - sentAt) / 86400000);
			if (diffDays < 0 || diffDays >= 28) continue;
			const bucketIndex = 27 - diffDays;
			buckets[bucketIndex] += message.senderKind === 'contact' ? 2 : 1;
		}

		return buckets.map((value) => clamp(value, 0, 4));
	});

	const cadenceCaption = $derived.by(() => {
		if (thread.unreadCount > 0) {
			return `${thread.unreadCount} waiting with ${contactReplyCount} recent contact replies in this thread.`;
		}

		if (contactReplyCount > 0) {
			return `${contactReplyCount} contact replies and ${ownerReplyCount} sent updates across recent activity.`;
		}

		return 'Low recent reply movement in this conversation.';
	});
	const threadModeLabel = $derived.by(() => {
		if (archived) {
			return 'Archived';
		}

		if (muted) {
			return 'Muted';
		}

		if (thread.participant.isFakeUser) {
			return 'Demo thread';
		}

		return 'Active';
	});
	const peerThreads = $derived.by(() =>
		threads
			.filter((entry) => entry.id !== thread.id && !isThreadArchived(entry))
			.slice(0, 3)
			.map((entry) => ({
				id: entry.id,
				name: entry.participant.name,
				subtitle: entry.participant.subtitle || 'Direct conversation',
				avatarUrl: entry.participant.avatar_url,
				initials: getParticipantInitials(entry.participant.name),
				note:
					entry.unreadCount > 0
						? `${entry.unreadCount} unread`
						: formatThreadTimestamp(getThreadLastMessageSentAt(entry)) || 'now'
			}))
	);
</script>

<Card.Root class="hidden h-full min-h-0 overflow-hidden border-border/70 bg-card xl:flex xl:flex-col">
	<Card.Content class="flex h-full min-h-0 flex-col gap-4 py-4.5">
		<div class="space-y-0.5">
			<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				Conversation context
			</p>
			<p class="text-[0.84rem] leading-5 text-muted-foreground">
				Fast thread state and recent reply movement.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<Avatar.Root class="size-12 border border-border/70 bg-background shadow-sm after:hidden">
				{#if thread.participant.avatar_url}
					<Avatar.Image src={thread.participant.avatar_url} alt={thread.participant.name} />
				{:else}
					<Avatar.Fallback class="text-base font-semibold text-foreground">{initials}</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<div class="min-w-0 flex-1">
				<p class="truncate text-[0.98rem] font-semibold text-foreground">{thread.participant.name}</p>
				<p class="truncate text-[0.82rem] text-muted-foreground">
					{thread.participant.subtitle || 'Direct conversation'}
				</p>
			</div>
		</div>

		<div class="rounded-[1.1rem] bg-muted/20 px-3.5 py-3">
			<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				Latest note
			</p>
			<p class="mt-1.5 text-[0.84rem] leading-5 text-foreground">{latestPreview}</p>
		</div>

		<div class="grid gap-2.5 border-t border-border/60 pt-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Updated</p>
				<p class="mt-1 text-[0.84rem] font-medium text-foreground">{lastUpdatedLabel}</p>
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Unread</p>
				<p class="mt-1 text-[0.84rem] font-medium text-foreground">
					{thread.unreadCount > 0 ? `${thread.unreadCount} waiting` : 'Caught up'}
				</p>
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Thread</p>
				<p class="mt-1 text-[0.84rem] font-medium text-foreground">{threadModeLabel}</p>
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Messages</p>
				<p class="mt-1 text-[0.84rem] font-medium text-foreground">{totalMessageCount} total</p>
			</div>
			<div class="sm:col-span-2 xl:col-span-1 2xl:col-span-2">
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contact replies</p>
				<p class="mt-1 text-[0.84rem] font-medium text-foreground">{contactReplyCount} sent from this contact</p>
			</div>
		</div>

		<ActivityDotGrid
			title="Reply cadence"
			caption={cadenceCaption}
			values={replyCadenceValues}
			compact={true}
			footer="Past 4 weeks"
		/>

		{#if peerThreads.length > 0}
			<div class="border-t border-border/60 pt-3">
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
					Other active people
				</p>
				<div class="mt-2.5 space-y-1.5">
					{#each peerThreads as peer (peer.id)}
						<button
							type="button"
							class="flex w-full items-center gap-2.5 rounded-[0.95rem] px-2 py-2 text-left transition-colors hover:bg-muted/22"
							onclick={() => onSelectThread(peer.id)}
						>
							<Avatar.Root class="size-9 border border-border/70 bg-background shadow-sm after:hidden">
								{#if peer.avatarUrl}
									<Avatar.Image src={peer.avatarUrl} alt={peer.name} />
								{:else}
									<Avatar.Fallback class="text-xs font-semibold text-foreground">
										{peer.initials}
									</Avatar.Fallback>
								{/if}
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<p class="truncate text-[0.84rem] font-medium text-foreground">{peer.name}</p>
								<p class="truncate text-[0.72rem] text-muted-foreground">{peer.subtitle}</p>
							</div>
							<p class="shrink-0 text-[0.68rem] font-medium text-muted-foreground">{peer.note}</p>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>