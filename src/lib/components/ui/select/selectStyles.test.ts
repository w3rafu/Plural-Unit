import { describe, expect, it } from 'vitest';
import {
	getSelectContentClass,
	getSelectItemClass,
	getSelectRootClass,
	getSelectTriggerClass
} from './selectStyles';

describe('selectStyles', () => {
	it('builds the root class', () => {
		expect(getSelectRootClass('extra')).toBe('relative w-full extra');
	});

	it('builds the trigger class', () => {
		expect(getSelectTriggerClass()).toContain('border-input');
		expect(getSelectTriggerClass('extra')).toContain('extra');
	});

	it('builds the content and item classes', () => {
		expect(getSelectContentClass()).toContain('shadow-md');
		expect(getSelectItemClass()).toContain('select-none');
	});
});
