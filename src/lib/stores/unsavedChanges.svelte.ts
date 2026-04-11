import { untrack } from 'svelte';
import { buildUnsavedChangesPrompt } from '$lib/models/unsavedChanges';

type UnsavedChangesEntry = {
	key: string;
	label: string;
};

class UnsavedChangesStore {
	private entries = $state<UnsavedChangesEntry[]>([]);

	get activeEntries() {
		return this.entries;
	}

	get hasUnsavedChanges() {
		return this.entries.length > 0;
	}

	get prompt() {
		return buildUnsavedChangesPrompt(this.entries.map((entry) => entry.label));
	}

	set(key: string, label: string, isDirty: boolean) {
		untrack(() => {
			if (!isDirty) {
				this.clear(key);
				return;
			}

			const nextEntry = { key, label };
			const existingIndex = this.entries.findIndex((entry) => entry.key === key);

			if (existingIndex === -1) {
				this.entries = [...this.entries, nextEntry];
				return;
			}

			const existingEntry = this.entries[existingIndex];
			if (existingEntry?.label === label) {
				return;
			}

			this.entries = this.entries.map((entry, index) => (index === existingIndex ? nextEntry : entry));
		});
	}

	clear(key: string) {
		untrack(() => {
			const nextEntries = this.entries.filter((entry) => entry.key !== key);
			if (nextEntries.length !== this.entries.length) {
				this.entries = nextEntries;
			}
		});
	}

	clearAll() {
		untrack(() => {
			if (this.entries.length > 0) {
				this.entries = [];
			}
		});
	}
}

export const unsavedChanges = new UnsavedChangesStore();
