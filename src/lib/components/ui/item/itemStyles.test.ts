import { describe, expect, it } from 'vitest';
import {
	getItemActionsClass,
	getItemContentClass,
	getItemDescriptionClass,
	getItemGroupClass,
	getItemRootClass,
	getItemTitleClass
} from './itemStyles';

describe('itemStyles', () => {
	it('builds the root class for the default item', () => {
		expect(getItemRootClass({})).toContain('shadow-sm');
		expect(getItemRootClass({})).toContain('border-border');
	});

	it('builds variant and size classes', () => {
		const className = getItemRootClass({ variant: 'muted', size: 'sm', className: 'extra' });
		expect(className).toContain('bg-muted/50');
		expect(className).toContain('gap-3');
		expect(className).toContain('extra');
	});

	it('builds the supporting slot classes', () => {
		expect(getItemContentClass()).toContain('flex-1');
		expect(getItemDescriptionClass()).toContain('text-muted-foreground');
		expect(getItemTitleClass()).toContain('tracking-tight');
		expect(getItemActionsClass()).toContain('flex-none');
		expect(getItemGroupClass()).toContain('gap-3');
	});
});
