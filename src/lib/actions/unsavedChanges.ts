import { unsavedChanges } from '$lib/stores/unsavedChanges.svelte';

export type UnsavedChangesActionParams = {
	key: string;
	label: string;
	isDirty: boolean;
};

function syncUnsavedChangesEntry(params: UnsavedChangesActionParams) {
	unsavedChanges.set(params.key, params.label, params.isDirty);
}

export function syncUnsavedChanges(node: HTMLElement, params: UnsavedChangesActionParams) {
	void node;
	syncUnsavedChangesEntry(params);

	return {
		update(nextParams: UnsavedChangesActionParams) {
			if (nextParams.key !== params.key) {
				unsavedChanges.clear(params.key);
			}

			params = nextParams;
			syncUnsavedChangesEntry(params);
		},
		destroy() {
			unsavedChanges.clear(params.key);
		}
	};
}