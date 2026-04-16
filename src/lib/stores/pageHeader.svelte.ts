import { untrack } from 'svelte';

export type PageHeaderAction = {
	id: string;
	label: string;
	ariaLabel?: string;
	href?: string;
	onClick?: (() => void) | null;
	disabled?: boolean;
};

export type PageHeaderPreset = 'brand' | 'page' | 'section' | 'context' | 'detail';

export type PageHeaderConfig = {
	preset: PageHeaderPreset;
	title: string;
	subtitle?: string;
	avatarText?: string;
	avatarImageUrl?: string;
	backLabel?: string;
	onBack?: (() => void) | null;
	actions?: PageHeaderAction[];
};

export type PageHeaderConfigInput = Omit<PageHeaderConfig, 'preset'> & {
	preset?: PageHeaderPreset;
};

export const DEFAULT_HEADER: Readonly<PageHeaderConfig> = {
	preset: 'brand',
	title: 'Plural Unit',
	subtitle: 'Logistic hub for organized communities',
	actions: []
};

/**
 * Resolve the effective header preset. Legacy names (section, context, detail)
 * all map to `page` so the Header component only has two visual variants.
 */
export function resolvePageHeaderPreset(config: PageHeaderConfigInput): PageHeaderPreset {
	if (config.preset && config.preset !== 'brand') {
		return 'page';
	}

	if (config.preset === 'brand') {
		return 'brand';
	}

	if (config.onBack && config.backLabel) {
		return 'page';
	}

	if ((config.actions?.length ?? 0) > 0) {
		return 'page';
	}

	return 'brand';
}

export function shouldShowPageHeaderSubtitle(preset: PageHeaderPreset) {
	return preset === 'brand' || preset === 'page';
}

export function buildPageHeaderConfig(config: PageHeaderConfigInput): PageHeaderConfig {
	return {
		...DEFAULT_HEADER,
		preset: resolvePageHeaderPreset(config),
		...config,
		actions: config.actions ? [...config.actions] : []
	};
}

function hasSameActions(
	left: PageHeaderAction[] | undefined,
	right: PageHeaderAction[] | undefined
): boolean {
	const leftActions = left ?? [];
	const rightActions = right ?? [];

	if (leftActions.length !== rightActions.length) {
		return false;
	}

	return leftActions.every((action, index) => {
		const other = rightActions[index];
		return (
			action.id === other?.id &&
			action.label === other?.label &&
			action.ariaLabel === other?.ariaLabel &&
			action.href === other?.href &&
			action.onClick === other?.onClick &&
			action.disabled === other?.disabled
		);
	});
}

function hasSameConfig(left: PageHeaderConfig, right: PageHeaderConfig): boolean {
	return (
		left.preset === right.preset &&
		left.title === right.title &&
		left.subtitle === right.subtitle &&
		left.avatarText === right.avatarText &&
		left.avatarImageUrl === right.avatarImageUrl &&
		left.backLabel === right.backLabel &&
		left.onBack === right.onBack &&
		hasSameActions(left.actions, right.actions)
	);
}

class PageHeaderStore {
	config = $state<PageHeaderConfig>(DEFAULT_HEADER);
	hasRegisteredHeader = $state(false);

	set(config: PageHeaderConfigInput) {
		const nextConfig = buildPageHeaderConfig(config);

		untrack(() => {
			if (!hasSameConfig(this.config, nextConfig)) {
				this.config = nextConfig;
			}

			if (!this.hasRegisteredHeader) {
				this.hasRegisteredHeader = true;
			}
		});
	}

	reset() {
		untrack(() => {
			if (!hasSameConfig(this.config, DEFAULT_HEADER)) {
				this.config = DEFAULT_HEADER;
			}

			if (this.hasRegisteredHeader) {
				this.hasRegisteredHeader = false;
			}
		});
	}
}

export const pageHeader = new PageHeaderStore();
