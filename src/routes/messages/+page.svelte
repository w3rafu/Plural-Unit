<!--
  Messages page — inbox + thread split view.
  Mobile: shows inbox or thread based on activeThreadId.
  Desktop: side-by-side layout.
-->
<script lang="ts">
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

<PageHeader title="Messages" subtitle="Conversations and threads" />

<main class="flex flex-col gap-2">
	{#if !currentMessages.isReady}
		<Card.Root size="sm" class="border-border/70 bg-card/70">
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
		<!-- Desktop: side-by-side -->
		<div class="hidden md:grid md:grid-cols-[320px_1fr] md:gap-2">
			<Card.Root class="h-[calc(100dvh-var(--app-shell-h))] overflow-hidden">
				<InboxPane
					threads={currentMessages.sortedThreads}
					activeThreadId={currentMessages.activeThreadId}
					onSelectThread={handleSelectThread}
				/>
			</Card.Root>

			<Card.Root class="h-[calc(100dvh-var(--app-shell-h))] overflow-hidden">
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
					<div class="flex h-full items-center justify-center">
						<p class="text-sm text-muted-foreground">Select a conversation</p>
					</div>
				{/if}
			</Card.Root>
		</div>

		<!-- Mobile: inbox or thread -->
		<div class="md:hidden">
			{#if showThread && currentMessages.activeThread}
				<Card.Root class="h-[calc(100dvh-var(--app-shell-h))] overflow-hidden">
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
				<Card.Root class="h-[calc(100dvh-var(--app-shell-h))] overflow-hidden">
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
