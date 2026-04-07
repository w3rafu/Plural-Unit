import type { ClassValue } from 'clsx';
import { cn } from '$lib/utils';

export type ItemVariant = 'default' | 'outline' | 'muted';
export type ItemSize = 'default' | 'sm';

export function getItemRootClass({
	variant = 'default',
	size = 'default',
	className
}: {
	variant?: ItemVariant;
	size?: ItemSize;
	className?: ClassValue;
} = {}) {
	return cn(
		'flex w-full gap-4 rounded-xl border p-4 transition-colors',
		variant === 'default' && 'border-border bg-background shadow-sm',
		variant === 'outline' && 'border-border bg-transparent',
		variant === 'muted' && 'border-transparent bg-muted/50',
		size === 'sm' && 'gap-3 p-3',
		className
	);
}

export function getItemContentClass(className?: ClassValue) {
	return cn('flex min-w-0 flex-1 flex-col gap-1.5', className);
}

export function getItemDescriptionClass(className?: ClassValue) {
	return cn('text-sm leading-6 text-muted-foreground', className);
}

export function getItemTitleClass(className?: ClassValue) {
	return cn('text-sm font-semibold leading-none tracking-tight', className);
}

export function getItemActionsClass(className?: ClassValue) {
	return cn('flex flex-none flex-wrap items-center gap-2', className);
}

export function getItemGroupClass(className?: ClassValue) {
	return cn('flex flex-col gap-3', className);
}
