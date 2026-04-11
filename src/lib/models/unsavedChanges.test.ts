import { describe, expect, it } from 'vitest';
import { buildUnsavedChangesPrompt, createDirtySnapshot } from '$lib/models/unsavedChanges';

describe('createDirtySnapshot', () => {
	it('creates stable snapshots for matching values', () => {
		const a = createDirtySnapshot({ name: 'Rafa', phone: '123' });
		const b = createDirtySnapshot({ name: 'Rafa', phone: '123' });

		expect(a).toBe(b);
	});

	it('creates different snapshots when values differ', () => {
		const a = createDirtySnapshot({ name: 'Rafa', phone: '123' });
		const b = createDirtySnapshot({ name: 'Rafa', phone: '456' });

		expect(a).not.toBe(b);
	});
});

describe('buildUnsavedChangesPrompt', () => {
	it('returns a generic prompt with no labels', () => {
		expect(buildUnsavedChangesPrompt([])).toContain('unsaved changes');
	});

	it('includes a single label when one section is dirty', () => {
		expect(buildUnsavedChangesPrompt(['profile details'])).toContain('profile details');
	});

	it('mentions both labels when two sections are dirty', () => {
		const prompt = buildUnsavedChangesPrompt(['profile details', 'security settings']);
		expect(prompt).toContain('profile details');
		expect(prompt).toContain('security settings');
	});
});
