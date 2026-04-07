import type { ClassValue } from 'clsx';
import { cn } from '$lib/utils';

export function getSelectRootClass(className?: ClassValue) {
	return cn('relative w-full', className);
}

export function getSelectTriggerClass(className?: ClassValue) {
	return cn(
		'border-input bg-background text-foreground flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground',
		className
	);
}

export function getSelectContentClass(className?: ClassValue) {
	return cn(
		'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
		className
	);
}

export function getSelectItemClass(className?: ClassValue) {
	return cn(
		'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
		className
	);
}
