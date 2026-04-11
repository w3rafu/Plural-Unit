import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The toast store uses $state which requires Svelte 5 runes. Since we're
// testing pure logic (push/dismiss/scheduling), we import the store as-is.
// Vitest with the svelte plugin compiles runes correctly.

import { toastStore, toast } from './toast.svelte';

beforeEach(() => {
	vi.useFakeTimers();
	// Drain any leftover toasts
	for (const t of [...toastStore.toasts]) {
		toastStore.dismiss(t.id);
	}
});

afterEach(() => {
	vi.useRealTimers();
});

describe('toastStore.push', () => {
	it('adds a toast with defaults', () => {
		toastStore.push({ title: 'Hello' });

		expect(toastStore.toasts).toHaveLength(1);
		expect(toastStore.toasts[0].title).toBe('Hello');
		expect(toastStore.toasts[0].variant).toBe('default');
		expect(toastStore.toasts[0].description).toBe('');
	});

	it('respects custom variant and description', () => {
		toastStore.push({ title: 'Error', variant: 'error', description: 'Something went wrong' });

		const t = toastStore.toasts[toastStore.toasts.length - 1];
		expect(t.variant).toBe('error');
		expect(t.description).toBe('Something went wrong');
	});

	it('returns a unique id', () => {
		const id1 = toastStore.push({ title: 'A' });
		const id2 = toastStore.push({ title: 'B' });

		expect(id1).toBeTruthy();
		expect(id2).toBeTruthy();
		expect(id1).not.toBe(id2);
	});
});

describe('toastStore.dismiss', () => {
	it('removes a toast by id', () => {
		const id = toastStore.push({ title: 'Remove me' });

		toastStore.dismiss(id);

		expect(toastStore.toasts.find((t) => t.id === id)).toBeUndefined();
	});

	it('does nothing for unknown id', () => {
		toastStore.push({ title: 'Keep' });
		const count = toastStore.toasts.length;

		toastStore.dismiss('nonexistent');

		expect(toastStore.toasts.length).toBe(count);
	});
});

describe('auto-dismiss', () => {
	it('removes the toast after its duration', () => {
		toastStore.push({ title: 'Auto', duration: 1000 });

		expect(toastStore.toasts).toHaveLength(1);

		vi.advanceTimersByTime(1000);

		expect(toastStore.toasts).toHaveLength(0);
	});

	it('does not auto-dismiss when duration is 0', () => {
		toastStore.push({ title: 'Sticky', duration: 0 });

		vi.advanceTimersByTime(10_000);

		expect(toastStore.toasts).toHaveLength(1);

		// Clean up
		toastStore.dismiss(toastStore.toasts[0].id);
	});

	it('cancels the timer when manually dismissed early', () => {
		const id = toastStore.push({ title: 'Early', duration: 5000 });

		toastStore.dismiss(id);
		vi.advanceTimersByTime(5000);

		expect(toastStore.toasts).toHaveLength(0);
	});
});

describe('toast() shortcut', () => {
	it('pushes via the global function', () => {
		const id = toast({ title: 'Shortcut', variant: 'success' });

		expect(toastStore.toasts.some((t) => t.id === id)).toBe(true);
		expect(toastStore.toasts.find((t) => t.id === id)!.variant).toBe('success');
	});
});
