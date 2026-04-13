import { describe, expect, it } from 'vitest';
import {
	getResourceDestinationLabel,
	moveResourceRows,
	normalizeResourceHref,
	removeResourceRow,
	replaceResourceRow,
	sortResourceRows,
	validateResourceHref
} from './resourcesModel';

function makeResource(
	overrides: Partial<{
		id: string;
		organization_id: string;
		title: string;
		description: string;
		href: string;
		resource_type: 'link' | 'form' | 'document' | 'contact';
		sort_order: number;
		created_at: string;
		updated_at: string;
	}> = {}
) {
	return {
		id: overrides.id ?? 'r1',
		organization_id: overrides.organization_id ?? 'org-1',
		title: overrides.title ?? 'Guide',
		description: overrides.description ?? 'Setup steps',
		href: overrides.href ?? 'https://example.com/guide',
		resource_type: overrides.resource_type ?? 'document',
		sort_order: overrides.sort_order ?? 0,
		created_at: overrides.created_at ?? '2026-04-12T10:00:00.000Z',
		updated_at: overrides.updated_at ?? '2026-04-12T10:00:00.000Z'
	};
}

describe('resourcesModel', () => {
	it('normalizes plain links and contact destinations', () => {
		expect(normalizeResourceHref('example.com/resource', 'link')).toBe('https://example.com/resource');
		expect(normalizeResourceHref('person@example.com', 'contact')).toBe('mailto:person@example.com');
		expect(normalizeResourceHref('+1 555 0100', 'contact')).toBe('tel:+1 555 0100');
	});

	it('validates normalized destinations', () => {
		expect(validateResourceHref('forms.gle/example', 'form')).toBe('https://forms.gle/example');
		expect(() => validateResourceHref('', 'document')).toThrow('Enter a destination link or contact detail.');
	});

	it('formats resource destinations for compact display', () => {
		expect(getResourceDestinationLabel('https://www.example.com/docs/start')).toBe('example.com/docs/start');
		expect(getResourceDestinationLabel('mailto:person@example.com')).toBe('person@example.com');
	});

	it('sorts resources by sort order and creation time', () => {
		const sorted = sortResourceRows([
			makeResource({ id: 'r3', sort_order: 1, created_at: '2026-04-12T12:00:00.000Z' }),
			makeResource({ id: 'r1', sort_order: 0, created_at: '2026-04-12T11:00:00.000Z' }),
			makeResource({ id: 'r2', sort_order: 1, created_at: '2026-04-12T10:00:00.000Z' })
		]);

		expect(sorted.map((resource) => resource.id)).toEqual(['r1', 'r2', 'r3']);
	});

	it('replaces, removes, and moves rows while keeping order stable', () => {
		const rows = [
			makeResource({ id: 'r1', sort_order: 0, title: 'First' }),
			makeResource({ id: 'r2', sort_order: 1, title: 'Second' }),
			makeResource({ id: 'r3', sort_order: 2, title: 'Third' })
		];

		const replaced = replaceResourceRow(rows, makeResource({ id: 'r2', sort_order: 1, title: 'Updated second' }));
		expect(replaced.find((resource) => resource.id === 'r2')?.title).toBe('Updated second');

		const removed = removeResourceRow(rows, 'r2');
		expect(removed.map((resource) => resource.id)).toEqual(['r1', 'r3']);

		const moved = moveResourceRows(rows, 'r3', 'up');
		expect(moved.map((resource) => `${resource.id}:${resource.sort_order}`)).toEqual([
			'r1:0',
			'r3:1',
			'r2:2'
		]);
	});
});