<!--
  MessageComposer — text input with send button.
  Supports text messages and image file attachment.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { SendHorizontal, ImagePlus } from '@lucide/svelte';

	let {
		isSending = false,
		onSendMessage,
		onSendImage
	}: {
		isSending?: boolean;
		onSendMessage: (body: string) => void;
		onSendImage: (file: File) => void;
	} = $props();

	let text = $state('');
	let fileInput = $state<HTMLInputElement | null>(null);

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const trimmed = text.trim();
		if (!trimmed || isSending) return;
		onSendMessage(trimmed);
		text = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			const trimmed = text.trim();
			if (!trimmed || isSending) return;
			onSendMessage(trimmed);
			text = '';
		}
	}

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			onSendImage(file);
			input.value = '';
		}
	}
</script>

<form
	class="flex items-center gap-2 border-t border-border/70 px-3 py-2"
	onsubmit={handleSubmit}
>
	<button
		type="button"
		class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
		onclick={() => fileInput?.click()}
		disabled={isSending}
		aria-label="Attach image"
	>
		<ImagePlus class="h-5 w-5" />
	</button>

	<Input
		type="text"
		placeholder="Type a message..."
		class="flex-1"
		bind:value={text}
		onkeydown={handleKeydown}
		disabled={isSending}
	/>

	<Button
		type="submit"
		size="icon"
		variant="default"
		disabled={!text.trim() || isSending}
		aria-label="Send message"
	>
		<SendHorizontal class="h-4 w-4" />
	</Button>

	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={handleFileChange}
	/>
</form>
