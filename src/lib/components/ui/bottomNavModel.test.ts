import { describe, expect, it } from 'vitest';
import { getActiveBottomNavTab, getBottomNavTabs } from './bottomNavModel';

describe('bottomNavModel', () => {
	it('defines the minimal plural unit tab set', () => {
		expect(getBottomNavTabs().map((tab) => tab.id)).toEqual([
			'home',
			'hub',
			'organization',
			'profile'
		]);
	});

	it('maps existing routes to their active tabs', () => {
		expect(getActiveBottomNavTab('/')).toBe('home');
		expect(getActiveBottomNavTab('/hub')).toBe('hub');
		expect(getActiveBottomNavTab('/hub/manage')).toBe('hub');
		expect(getActiveBottomNavTab('/organization')).toBe('organization');
		expect(getActiveBottomNavTab('/profile')).toBe('profile');
		expect(getActiveBottomNavTab('/missing')).toBeNull();
	});
});