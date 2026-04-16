/**
 * Theme store — manages the active colour-theme.
 *
 * A "theme" is a CSS file under `src/themes/` that sets custom-property
 * overrides scoped to `[data-theme="<name>"]`. The default theme (`zinc`)
 * uses bare `:root` / `.dark` selectors so no attribute is needed.
 *
 * Usage:
 *   import { currentTheme } from '$lib/stores/currentTheme.svelte';
 *   currentTheme.set('midnight');   // switches immediately
 *   currentTheme.name;              // reactive current name
 */

const STORAGE_KEY = 'plural-unit-theme';
const DEFAULT_THEME = 'zinc';

/** Registered theme ids — keep in sync with `src/themes/` files. */
export const AVAILABLE_THEMES = ['zinc', 'midnight'] as const;
export type ThemeName = (typeof AVAILABLE_THEMES)[number];

function isThemeName(value: string): value is ThemeName {
	return (AVAILABLE_THEMES as readonly string[]).includes(value);
}

function readStoredTheme(): ThemeName {
	if (typeof window === 'undefined') return DEFAULT_THEME;
	const stored = localStorage.getItem(STORAGE_KEY) ?? '';
	return isThemeName(stored) ? stored : DEFAULT_THEME;
}

function applyThemeAttribute(theme: ThemeName) {
	if (typeof document === 'undefined') return;
	if (theme === DEFAULT_THEME) {
		document.documentElement.removeAttribute('data-theme');
	} else {
		document.documentElement.setAttribute('data-theme', theme);
	}
}

function createThemeStore() {
	let name = $state<ThemeName>(DEFAULT_THEME);

	// Hydrate from localStorage on first access in the browser.
	if (typeof window !== 'undefined') {
		name = readStoredTheme();
		applyThemeAttribute(name);
	}

	return {
		get name(): ThemeName {
			return name;
		},

		set(theme: ThemeName) {
			name = theme;
			applyThemeAttribute(theme);
			if (typeof window !== 'undefined') {
				localStorage.setItem(STORAGE_KEY, theme);
			}
		},

		/** Cycle to the next theme in the list. */
		next() {
			const idx = AVAILABLE_THEMES.indexOf(name);
			const next = AVAILABLE_THEMES[(idx + 1) % AVAILABLE_THEMES.length];
			this.set(next);
		}
	};
}

export const currentTheme = createThemeStore();
