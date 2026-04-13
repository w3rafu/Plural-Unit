import type { ResourceRow, ResourceType } from '$lib/repositories/hubRepository';

export type ResourceMoveDirection = 'up' | 'down';

export const HUB_RESOURCE_TYPE_OPTIONS = [
	{ value: 'link', label: 'Link' },
	{ value: 'form', label: 'Form' },
	{ value: 'document', label: 'Document' },
	{ value: 'contact', label: 'Contact' }
] as const satisfies Array<{ value: ResourceType; label: string }>;

function getTime(value: string | null | undefined) {
	if (!value) {
		return 0;
	}

	const parsed = new Date(value).getTime();
	return Number.isNaN(parsed) ? 0 : parsed;
}

function isMailtoHref(value: string) {
	return /^mailto:/i.test(value);
}

function isTelephoneHref(value: string) {
	return /^tel:/i.test(value);
}

function isHttpHref(value: string) {
	return /^https?:\/\//i.test(value);
}

function normalizeHttpHref(value: string) {
	const normalized = value.trim();
	if (!normalized) {
		return '';
	}

	if (isHttpHref(normalized)) {
		return normalized;
	}

	return `https://${normalized}`;
}

function normalizeContactHref(value: string) {
	const normalized = value.trim();
	if (!normalized) {
		return '';
	}

	if (isHttpHref(normalized) || isMailtoHref(normalized) || isTelephoneHref(normalized)) {
		return normalized;
	}

	if (normalized.includes('@') && !normalized.includes(' ')) {
		return `mailto:${normalized}`;
	}

	if (/[0-9]/.test(normalized)) {
		return `tel:${normalized}`;
	}

	return `https://${normalized}`;
}

function validateNormalizedHref(value: string, resourceType: ResourceType) {
	if (!value) {
		throw new Error('Enter a destination link or contact detail.');
	}

	if (isHttpHref(value)) {
		try {
			new URL(value);
		} catch {
			throw new Error('Use a valid link that members can open.');
		}
		return;
	}

	if (resourceType === 'contact' && isMailtoHref(value)) {
		if (value.slice('mailto:'.length).trim()) {
			return;
		}
		throw new Error('Enter an email address or full contact link.');
	}

	if (resourceType === 'contact' && isTelephoneHref(value)) {
		if (value.slice('tel:'.length).trim()) {
			return;
		}
		throw new Error('Enter a phone number or full contact link.');
	}

	throw new Error(
		resourceType === 'contact'
			? 'Use a contact page link, email address, or phone number.'
			: 'Use a full link that starts with http:// or https://.'
	);
}

export function normalizeResourceHref(value: string, resourceType: ResourceType) {
	return resourceType === 'contact' ? normalizeContactHref(value) : normalizeHttpHref(value);
}

export function validateResourceHref(value: string, resourceType: ResourceType) {
	const normalizedHref = normalizeResourceHref(value, resourceType);
	validateNormalizedHref(normalizedHref, resourceType);
	return normalizedHref;
}

export function getResourceTypeLabel(resourceType: ResourceType) {
	switch (resourceType) {
		case 'form':
			return 'Form';
		case 'document':
			return 'Document';
		case 'contact':
			return 'Contact';
		default:
			return 'Link';
	}
}

export function getResourceActionLabel(resourceType: ResourceType) {
	switch (resourceType) {
		case 'form':
			return 'Open form';
		case 'document':
			return 'View document';
		case 'contact':
			return 'Open contact';
		default:
			return 'Open link';
	}
}

export function getResourceDestinationLabel(href: string) {
	const normalized = href.trim();

	if (!normalized) {
		return 'No destination';
	}

	if (isMailtoHref(normalized)) {
		return normalized.slice('mailto:'.length);
	}

	if (isTelephoneHref(normalized)) {
		return normalized.slice('tel:'.length);
	}

	try {
		const url = new URL(normalized);
		const host = url.host.replace(/^www\./i, '');
		const path = url.pathname === '/' ? '' : url.pathname;
		return `${host}${path}`;
	} catch {
		return normalized;
	}
}

export function sortResourceRows(rows: ResourceRow[]) {
	return [...rows].sort((left, right) => {
		if (left.sort_order !== right.sort_order) {
			return left.sort_order - right.sort_order;
		}

		return getTime(left.created_at) - getTime(right.created_at);
	});
}

function renumberResourceRows(rows: ResourceRow[]) {
	return rows.map((row, index) => ({ ...row, sort_order: index }));
}

export function replaceResourceRow(rows: ResourceRow[], row: ResourceRow) {
	return sortResourceRows([...rows.filter((existingRow) => existingRow.id !== row.id), row]);
}

export function removeResourceRow(rows: ResourceRow[], resourceId: string) {
	return sortResourceRows(rows.filter((row) => row.id !== resourceId));
}

export function moveResourceRows(
	rows: ResourceRow[],
	resourceId: string,
	direction: ResourceMoveDirection
) {
	const orderedRows = sortResourceRows(rows);
	const currentIndex = orderedRows.findIndex((row) => row.id === resourceId);

	if (currentIndex === -1) {
		return orderedRows;
	}

	const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
	if (nextIndex < 0 || nextIndex >= orderedRows.length) {
		return orderedRows;
	}

	const nextRows = [...orderedRows];
	[nextRows[currentIndex], nextRows[nextIndex]] = [nextRows[nextIndex], nextRows[currentIndex]];

	return renumberResourceRows(nextRows);
}