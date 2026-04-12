import { describe, expect, it } from 'vitest';
import { getActiveBottomNavTab, getBottomNavTabs } from './bottomNavModel';

describe('bottomNavModel', () => {
	it('defines the plural unit tab set', () => {
		expect(getBottomNavTabs().map((tab) => tab.id)).toEqual([
			'hub',
			'messages',
			'directory',
			'profile'
		]);
	});

	it('maps existing routes to their active tabs', () => {
		expect(getActiveBottomNavTab('/')).toBe('hub');
		expect(getActiveBottomNavTab('/hub/manage')).toBe('hub');
		expect(getActiveBottomNavTab('/hub/manage/sections')).toBe('hub');
		expect(getActiveBottomNavTab('/organization')).toBeNull();
		expect(getActiveBottomNavTab('/organization/access')).toBeNull();
		expect(getActiveBottomNavTab('/directory')).toBe('directory');
		expect(getActiveBottomNavTab('/directory/user-1')).toBe('directory');
		expect(getActiveBottomNavTab('/profile')).toBe('profile');
		expect(getActiveBottomNavTab('/messages')).toBe('messages');
		expect(getActiveBottomNavTab('/messages/thread-1')).toBe('messages');
		expect(getActiveBottomNavTab('/missing')).toBeNull();
	});
});