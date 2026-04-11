export function createDirtySnapshot(value: unknown): string {
	return JSON.stringify(value);
}

export function buildUnsavedChangesPrompt(labels: string[]): string {
	const uniqueLabels = [...new Set(labels.map((label) => label.trim()).filter(Boolean))];

	if (uniqueLabels.length === 0) {
		return 'You have unsaved changes. Leave without saving?';
	}

	if (uniqueLabels.length === 1) {
		return `You have unsaved changes in ${uniqueLabels[0]}. Leave without saving?`;
	}

	if (uniqueLabels.length === 2) {
		return `You have unsaved changes in ${uniqueLabels[0]} and ${uniqueLabels[1]}. Leave without saving?`;
	}

	return 'You have unsaved changes in multiple sections. Leave without saving?';
}
