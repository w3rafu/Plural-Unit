<!--
  Messages page — inbox + thread split view.
  Mobile: shows inbox or thread based on activeThreadId.
  Desktop: side-by-side layout.
-->
<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import ContactPicker from '$lib/components/messages/ContactPicker.svelte';
	import MessageWorkspace from '$lib/components/messages/MessageWorkspace.svelte';
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import { currentMessages } from '$lib/stores/currentMessages.svelte';
	import { currentOrganization } from '$lib/stores/currentOrganization.svelte';
	import { currentUser } from '$lib/stores/currentUser.svelte';

	let contactPickerOpen = $state(false);

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

	function handleArchiveThread() {
		void currentMessages.archiveThread();
	}

	function handleUnarchiveThread() {
		void currentMessages.unarchiveThread();
	}

	function handleMuteThread() {
		void currentMessages.muteThread();
	}

	function handleUnmuteThread() {
		void currentMessages.unmuteThread();
	}

	function handleDeleteMessage(messageId: string) {
		void currentMessages.deleteMessage(messageId);
	}

	function handleTyping() {
		currentMessages.notifyTyping();
	}

	function handleResetDemo() {
		void currentMessages.resetDemoThread();
	}

	function handleLoadOlderMessages() {
		void currentMessages.loadOlderMessages();
	}

	function handleCompose() {
		contactPickerOpen = true;
	}

	function handleSelectMember(profileId: string) {
		void currentMessages.openConversationForProfile(profileId);
	}

	const headerSubtitle = $derived(
		currentMessages.activeThreadId ? '' : 'Direct and group threads'
	);
</script>

<PageHeader preset="section" title="Messages" subtitle={headerSubtitle} />

<main class="flex h-full min-h-0 flex-1 flex-col gap-1.5 overflow-hidden sm:gap-2">
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
		<MessageWorkspace
			threads={currentMessages.sortedThreads}
			activeThreadId={currentMessages.activeThreadId}
			activeThread={currentMessages.activeThread}
			isSending={currentMessages.isSending}
			isResetting={currentMessages.isResetting}
			isArchiving={Boolean(
				currentMessages.activeThreadId &&
				currentMessages.archivingThreadId === currentMessages.activeThreadId
			)}
			isMuting={Boolean(
				currentMessages.activeThreadId &&
				currentMessages.mutingThreadId === currentMessages.activeThreadId
			)}
			isLoadingOlderMessages={currentMessages.isLoadingOlderMessages}
			deletingMessageId={currentMessages.deletingMessageId}
			contactTyping={currentMessages.contactTyping}
			onSelectThread={handleSelectThread}
			onSendMessage={handleSendMessage}
			onSendImage={handleSendImage}
			onArchiveThread={handleArchiveThread}
			onUnarchiveThread={handleUnarchiveThread}
			onMuteThread={handleMuteThread}
			onUnmuteThread={handleUnmuteThread}
			onDeleteMessage={handleDeleteMessage}
			onTyping={handleTyping}
			onBack={handleBack}
			onResetDemo={handleResetDemo}
			onLoadOlderMessages={handleLoadOlderMessages}
			onCompose={handleCompose}
		/>
	{/if}

	<ContactPicker
		bind:open={contactPickerOpen}
		members={currentOrganization.members}
		currentProfileId={currentUser.details.id}
		onSelectMember={handleSelectMember}
	/>
</main>
