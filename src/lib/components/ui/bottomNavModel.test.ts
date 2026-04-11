import { describe, expect, it } from 'vitest';
import { getActiveBottomNavTab, getBottomNavTabs } from './bottomNavModel';

describe('bottomNavModel', () => {
	it('defines the plural unit tab set', () => {
		expect(getBottomNavTabs().map((tab) => tab.id)).toEqual([
			'hub',
			'messages',
			'organization',
			'profile'
		]);
	});

	it('maps existing routes to their active tabs', () => {
		expect(getActiveBottomNavTab('/')).toBe('hub');
		expect(getActiveBottomNavTab('/hub/manage')).toBe('hub');
		expect(getActiveBottomNavTab('/hub/manage/sections')).toBe('hub');
		expect(getActiveBottomNavTab('/organization')).toBe('organization');
		expect(getActiveBottomNavTab('/profile')).toBe('profile');
		expect(getActiveBottomNavTab('/messages')).toBe('messages');
		expect(getActiveBottomNavTab('/messages/thread-1')).toBe('messages');
		expect(getActiveBottomNavTab('/missing')).toBeNull();
	});
});