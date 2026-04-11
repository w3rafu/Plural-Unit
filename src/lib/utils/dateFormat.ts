/**
 * Date formatting utility — shared date display functions.
 *
 * Every component that renders a date should use one of these
 * instead of creating its own Intl.DateTimeFormat or toLocaleDateString call.
 */

/** "Apr 11, 2026" */
export function formatShortDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

/** "Apr 11, 2:30 PM" */
export function formatShortDateTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

/** "Fri, Apr 11, 2:30 PM" */
export function formatEventDateTime(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';
	return new Intl.DateTimeFormat(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	}).format(date);
}
