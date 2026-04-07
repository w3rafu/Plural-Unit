export type BottomNavTabId = 'home' | 'hub' | 'organization' | 'profile';

export type BottomNavTabDefinition = {
	id: BottomNavTabId;
	label: string;
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
			id: 'home',
			label: 'Home',
			href: '/',
			ownsPath: (pathname) => isExactPath(pathname, '/')
		},
		{
			id: 'hub',
			label: 'Hub',
			href: '/hub',
			ownsPath: (pathname) => isPathPrefix(pathname, '/hub')
		},
		{
			id: 'organization',
			label: 'Organization',
			href: '/organization',
			ownsPath: (pathname) => isPathPrefix(pathname, '/organization')
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