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

		this.entries = this.entries.map((entry, index) => (index === existingIndex ? nextEntry : entry));
	}

	clear(key: string) {
		this.entries = this.entries.filter((entry) => entry.key !== key);
	}

	clearAll() {
		this.entries = [];
	}
}

export const unsavedChanges = new UnsavedChangesStore();
