export type PageHeaderAction = {
	id: string;
	label: string;
	ariaLabel?: string;
	href?: string;
	onClick?: (() => void) | null;
	disabled?: boolean;
};

export type PageHeaderPreset = 'brand' | 'section' | 'context' | 'detail';

export type PageHeaderConfig = {
	preset: PageHeaderPreset;
	title: string;
	subtitle?: string;
	avatarText?: string;
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
	subtitle: 'Wireframe app shell',
	actions: []
};

export function resolvePageHeaderPreset(config: PageHeaderConfigInput): PageHeaderPreset {
	if (config.preset) {
		return config.preset;
	}

	if (config.onBack && config.backLabel) {
		return 'context';
	}

	if ((config.actions?.length ?? 0) > 0) {
		return 'section';
	}

	return 'brand';
}

export function shouldShowPageHeaderSubtitle(preset: PageHeaderPreset) {
	return preset === 'brand' || preset === 'section';
}

export function buildPageHeaderConfig(config: PageHeaderConfigInput): PageHeaderConfig {
	return {
		...DEFAULT_HEADER,
		preset: resolvePageHeaderPreset(config),
		...config,
		actions: config.actions ? [...config.actions] : []
	};
}

class PageHeaderStore {
	config = $state<PageHeaderConfig>(DEFAULT_HEADER);

	set(config: PageHeaderConfigInput) {
		this.config = buildPageHeaderConfig(config);
	}

	reset() {
		this.config = DEFAULT_HEADER;
	}
}

export const pageHeader = new PageHeaderStore();