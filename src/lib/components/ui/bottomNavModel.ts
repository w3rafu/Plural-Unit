export type BottomNavTabId = 'hub' | 'messages' | 'directory' | 'profile';

export type BottomNavTabDefinition = {
	id: BottomNavTabId;
	label: string;
	shortLabel?: string;
	href: string;
	ownsPath: (pathname: string) => boolean;
};

function isExactPath(pathname: string, expectedPath: string) {
	return pathname === expectedPath;
}

function isPathPrefix(pathname: string, prefix: string) {
	return pathname.startsWith(prefix);
}

export function getBottomNavTabs(): BottomNavTabDefinition[] {
	return [
		{
			id: 'hub',
			label: 'Hub',
			href: '/',
			ownsPath: (pathname) => isExactPath(pathname, '/') || isPathPrefix(pathname, '/hub')
		},
		{
			id: 'messages',
			label: 'Messages',
			href: '/messages',
			ownsPath: (pathname) => isPathPrefix(pathname, '/messages')
		},
		{
			id: 'directory',
			label: 'Directory',
			shortLabel: 'Dir',
			href: '/organization/members',
			ownsPath: (pathname) => isPathPrefix(pathname, '/organization/members')
		},
		{
			id: 'profile',
			label: 'Profile',
			href: '/profile',
			ownsPath: (pathname) => isPathPrefix(pathname, '/profile')
		}
	];
}

export const BOTTOM_NAV_TABS = getBottomNavTabs();

export function getActiveBottomNavTab(pathname: string): BottomNavTabId | null {
	return BOTTOM_NAV_TABS.find((tab) => tab.ownsPath(pathname))?.id ?? null;
}