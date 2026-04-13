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

/** "2 hours ago" or "in 3 days" */
export function formatRelativeDateTime(value: string, now = Date.now()): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '';

	const diffMs = date.getTime() - now;
	const absDiffMs = Math.abs(diffMs);
	const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

	if (absDiffMs < 60_000) {
		return diffMs >= 0 ? 'in less than a minute' : 'less than a minute ago';
	}

	if (absDiffMs < 3_600_000) {
		return formatter.format(Math.round(diffMs / 60_000), 'minute');
	}

	if (absDiffMs < 86_400_000) {
		return formatter.format(Math.round(diffMs / 3_600_000), 'hour');
	}

	if (absDiffMs < 604_800_000) {
		return formatter.format(Math.round(diffMs / 86_400_000), 'day');
	}

	if (absDiffMs < 2_592_000_000) {
		return formatter.format(Math.round(diffMs / 604_800_000), 'week');
	}

	if (absDiffMs < 31_536_000_000) {
		return formatter.format(Math.round(diffMs / 2_592_000_000), 'month');
	}

	return formatter.format(Math.round(diffMs / 31_536_000_000), 'year');
}
