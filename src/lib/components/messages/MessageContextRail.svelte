<script lang="ts">
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
	const totalMessageCount = $derived(thread.messages.filter((message) => !message.isDeleted).length);
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
	<Card.Content class="flex h-full min-h-0 flex-col gap-5 py-5">
		<div class="space-y-1">
			<p class="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				Conversation context
			</p>
			<p class="text-sm text-muted-foreground">
				Who this thread is with and what still needs attention.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<Avatar.Root class="size-14 border border-border/70 bg-background shadow-sm after:hidden">
				{#if thread.participant.avatar_url}
					<Avatar.Image src={thread.participant.avatar_url} alt={thread.participant.name} />
				{:else}
					<Avatar.Fallback class="text-base font-semibold text-foreground">{initials}</Avatar.Fallback>
				{/if}
			</Avatar.Root>

			<div class="min-w-0 flex-1">
				<p class="truncate text-[1.02rem] font-semibold text-foreground">{thread.participant.name}</p>
				<p class="truncate text-sm text-muted-foreground">
					{thread.participant.subtitle || 'Direct conversation'}
				</p>
			</div>
		</div>

		<div class="rounded-[1.25rem] bg-muted/20 px-4 py-3.5">
			<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
				Latest note
			</p>
			<p class="mt-2 text-sm leading-6 text-foreground">{latestPreview}</p>
		</div>

		<div class="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Updated</p>
				<p class="mt-1 text-sm font-medium text-foreground">{lastUpdatedLabel}</p>
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Unread</p>
				<p class="mt-1 text-sm font-medium text-foreground">
					{thread.unreadCount > 0 ? `${thread.unreadCount} waiting` : 'Caught up'}
				</p>
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Thread</p>
				<p class="mt-1 text-sm font-medium text-foreground">{threadModeLabel}</p>
			</div>
			<div>
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Messages</p>
				<p class="mt-1 text-sm font-medium text-foreground">{totalMessageCount} total</p>
			</div>
			<div class="sm:col-span-2 xl:col-span-1 2xl:col-span-2">
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contact replies</p>
				<p class="mt-1 text-sm font-medium text-foreground">{contactReplyCount} sent from this contact</p>
			</div>
		</div>

		{#if peerThreads.length > 0}
			<div class="border-t border-border/60 pt-4">
				<p class="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
					Other active people
				</p>
				<div class="mt-3 space-y-2.5">
					{#each peerThreads as peer (peer.id)}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-[1rem] px-2.5 py-2.5 text-left transition-colors hover:bg-muted/22"
							onclick={() => onSelectThread(peer.id)}
						>
							<Avatar.Root class="size-10 border border-border/70 bg-background shadow-sm after:hidden">
								{#if peer.avatarUrl}
									<Avatar.Image src={peer.avatarUrl} alt={peer.name} />
								{:else}
									<Avatar.Fallback class="text-xs font-semibold text-foreground">
										{peer.initials}
									</Avatar.Fallback>
								{/if}
							</Avatar.Root>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-foreground">{peer.name}</p>
								<p class="truncate text-xs text-muted-foreground">{peer.subtitle}</p>
							</div>
							<p class="shrink-0 text-[0.68rem] font-medium text-muted-foreground">{peer.note}</p>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</Card.Content>
</Card.Root>