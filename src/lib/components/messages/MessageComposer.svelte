<!--
  MessageComposer — text input with send button.
  Supports text messages and image file attachment.
-->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { SendHorizontal, ImagePlus } from '@lucide/svelte';

	let {
		isSending = false,
		onSendMessage,
		onSendImage,
		onTyping
	}: {
		isSending?: boolean;
		onSendMessage: (body: string) => void;
		onSendImage: (file: File) => void;
		onTyping?: () => void;
	} = $props();

	let text = $state('');
	const imageInputId = 'message-composer-image-upload';

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
			return;
		}
		onTyping?.();
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
	class="mt-auto border-t border-border/70 bg-background/95 px-2 py-1.75 backdrop-blur sm:px-3 sm:py-2"
	onsubmit={handleSubmit}
>
	<div class="flex items-end gap-2">
		<label
			for={imageInputId}
			class="mb-0.5 shrink-0 rounded-xl border border-border/70 bg-muted/30 p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
			aria-label="Attach image"
		>
			<ImagePlus class="h-5 w-5" />
		</label>

		<div class="min-w-0 flex-1">
			<Textarea
				placeholder="Write an update or reply..."
				class="max-h-24 min-h-9 rounded-[1.2rem] border-border/70 bg-muted/20 shadow-sm sm:max-h-28 sm:min-h-10 sm:rounded-[1.35rem]"
				bind:value={text}
				onkeydown={handleKeydown}
				disabled={isSending}
			/>
			<p class="hidden px-1 pt-1 text-[0.68rem] text-muted-foreground sm:block">
				Press Enter to send. Use Shift+Enter for a new line.
			</p>
		</div>

		<Button
			type="submit"
			size="sm"
			variant="default"
			class="mb-0.5 h-8.5 rounded-[1.1rem] px-3 sm:h-9.5 sm:rounded-xl sm:px-3.5"
			disabled={!text.trim() || isSending}
			aria-label="Send message"
		>
			<SendHorizontal class="h-4 w-4" />
			Send
		</Button>
	</div>

	<input
		id={imageInputId}
		type="file"
		accept="image/*"
		class="hidden"
		disabled={isSending}
		onchange={handleFileChange}
	/>
</form>
