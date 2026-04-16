import { describe, expect, it } from 'vitest';
import { isLockedContentRoute, LOCKED_CONTENT_ROUTE_PREFIXES } from './contentLayoutModel';

describe('contentLayoutModel', () => {
	it('defines the locked route prefixes used by split-pane surfaces', () => {
		expect(LOCKED_CONTENT_ROUTE_PREFIXES).toEqual([
			'/messages',
			'/directory',
			'/demo/messages',
			'/demo/directory'
		]);
	});

	it('locks exact and nested split-pane routes', () => {
		expect(isLockedContentRoute('/messages')).toBe(true);
		expect(isLockedContentRoute('/messages/thread-1')).toBe(true);
		expect(isLockedContentRoute('/directory')).toBe(true);
		expect(isLockedContentRoute('/directory/user-1')).toBe(true);
		expect(isLockedContentRoute('/demo/messages')).toBe(true);
		expect(isLockedContentRoute('/demo/messages/thread-1')).toBe(true);
		expect(isLockedContentRoute('/demo/directory')).toBe(true);
		expect(isLockedContentRoute('/demo/directory/user-1')).toBe(true);
	});

	it('keeps non-locked routes scrollable', () => {
		expect(isLockedContentRoute('/')).toBe(false);
		expect(isLockedContentRoute('/profile')).toBe(false);
		expect(isLockedContentRoute('/organization/access')).toBe(false);
		expect(isLockedContentRoute('/organization')).toBe(false);
		expect(isLockedContentRoute('/demo')).toBe(false);
		expect(isLockedContentRoute('/messages-demo')).toBe(false);
		expect(isLockedContentRoute('/directory-preview')).toBe(false);
	});
});