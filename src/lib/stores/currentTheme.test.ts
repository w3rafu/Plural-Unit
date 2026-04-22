// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('currentTheme', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		vi.resetModules();
	});

	async function loadThemeStore() {
		const mod = await import('./currentTheme.svelte');
		return mod.currentTheme;
	}

	it('defaults to zinc when localStorage is empty', async () => {
		const theme = await loadThemeStore();
		expect(theme.name).toBe('zinc');
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
	});

	it('reads stored theme from localStorage', async () => {
		localStorage.setItem('plural-unit-theme', 'midnight');
		const theme = await loadThemeStore();
		expect(theme.name).toBe('midnight');
	});

	it('falls back to zinc for unknown stored value', async () => {
		localStorage.setItem('plural-unit-theme', 'nonexistent');
		const theme = await loadThemeStore();
		expect(theme.name).toBe('zinc');
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
	});

	it('set() updates name and persists to localStorage', async () => {
		const theme = await loadThemeStore();
		theme.set('midnight');
		expect(theme.name).toBe('midnight');
		expect(localStorage.getItem('plural-unit-theme')).toBe('midnight');
	});

	it('set(midnight) applies data-theme attribute', async () => {
		const theme = await loadThemeStore();
		theme.set('midnight');
		expect(document.documentElement.getAttribute('data-theme')).toBe('midnight');
	});

	it('set(zinc) removes data-theme attribute', async () => {
		const theme = await loadThemeStore();
		theme.set('midnight');
		theme.set('zinc');
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
	});

	it('next() cycles through themes', async () => {
		const theme = await loadThemeStore();
		expect(theme.name).toBe('zinc');
		theme.next();
		expect(theme.name).toBe('midnight');
		theme.next();
		expect(theme.name).toBe('zinc');
	});

	it('AVAILABLE_THEMES contains expected themes', async () => {
		const mod = await import('./currentTheme.svelte');
		expect(mod.AVAILABLE_THEMES).toContain('zinc');
		expect(mod.AVAILABLE_THEMES).toContain('midnight');
	});
});
