<!--
  Messages page — inbox + thread split view.
  Mobile: shows inbox or thread based on activeThreadId.
  Desktop: side-by-side layout.
-->
<script lang="ts">
	import { MessageSquare } from '@lucide/svelte';
	import * as Card from '$lib/components/ui/card';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import InboxPane from '$lib/components/messages/InboxPane.svelte';
	import ThreadPane from '$lib/components/messages/ThreadPane.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';

	function handleSelectThread(threadId: string) {
		void currentMessages.selectThread(threadId);
	}

	function handleBack() {
		currentMessages.activeThreadId = '';
	}

	function handleSendMessage(body: string) {
		void currentMessages.sendMessage(body);
	}

	function handleSendImage(file: File) {
		void currentMessages.sendImage(file);
	}

	function handleResetDemo() {
		void currentMessages.resetDemoThread();
	}

	const showThread = $derived(!!currentMessages.activeThread);
</script>

<PageHeader preset="section" title="Messages" subtitle="Conversations and threads" />

<main class="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden">
	{#if !currentMessages.isReady}
		<Card.Root size="sm" class="border-border/70 bg-card">
			<Card.Content>
				<p class="text-sm text-muted-foreground">Loading messages...</p>
			</Card.Content>
		</Card.Root>
	{:else if currentMessages.error}
		<Card.Root size="sm" class="border-destructive/50 bg-destructive/5">
			<Card.Content>
				<p class="text-sm text-destructive">{currentMessages.error}</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="hidden min-h-0 flex-1 md:grid md:grid-cols-[340px_1fr] md:gap-2">
			<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
				<InboxPane
					threads={currentMessages.sortedThreads}
					activeThreadId={currentMessages.activeThreadId}
					onSelectThread={handleSelectThread}
				/>
			</Card.Root>

			<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
				{#if currentMessages.activeThread}
					<ThreadPane
						thread={currentMessages.activeThread}
						isSending={currentMessages.isSending}
						isResetting={currentMessages.isResetting}
						onSendMessage={handleSendMessage}
						onSendImage={handleSendImage}
						onResetDemo={handleResetDemo}
					/>
				{:else}
					<div class="flex h-full items-center justify-center bg-muted/[0.12] p-6">
						<div class="max-w-sm rounded-3xl border border-dashed border-border/70 bg-background px-6 py-8 text-center shadow-sm">
							<div class="mx-auto flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
								<MessageSquare class="size-5 text-muted-foreground" />
							</div>
							<p class="mt-4 font-medium text-foreground">Select a conversation</p>
							<p class="mt-1 text-sm text-muted-foreground">
								Choose a thread from the inbox to review history and send a reply.
							</p>
						</div>
					</div>
				{/if}
			</Card.Root>
		</div>

		<div class="min-h-0 flex-1 md:hidden">
			{#if showThread && currentMessages.activeThread}
				<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
					<ThreadPane
						thread={currentMessages.activeThread}
						isSending={currentMessages.isSending}
						isResetting={currentMessages.isResetting}
						onSendMessage={handleSendMessage}
						onSendImage={handleSendImage}
						onBack={handleBack}
						onResetDemo={handleResetDemo}
					/>
				</Card.Root>
			{:else}
				<Card.Root class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 bg-card">
					<InboxPane
						threads={currentMessages.sortedThreads}
						activeThreadId={currentMessages.activeThreadId}
						onSelectThread={handleSelectThread}
					/>
				</Card.Root>
			{/if}
		</div>
	{/if}
</main>
