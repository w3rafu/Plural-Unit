import type { ResourceRow, ResourceType } from '$lib/repositories/hubRepository';

export type ResourceMoveDirection = 'up' | 'down';
export type ResourceLifecycleState = 'live' | 'draft' | 'archived';
export type ResourceEngagementSignal = {
	label: string;
	copy: string;
	needsAttention: boolean;
};

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

export function isResourceDraft(resource: Pick<ResourceRow, 'is_draft'>) {
	return Boolean(resource.is_draft);
}

export function isResourceArchived(resource: Pick<ResourceRow, 'archived_at'>) {
	return Boolean(resource.archived_at);
}

export function isResourceLive(
	resource: Pick<ResourceRow, 'is_draft' | 'archived_at'>
) {
	return !isResourceDraft(resource) && !isResourceArchived(resource);
}

export function getResourceLifecycleState(
	resource: Pick<ResourceRow, 'is_draft' | 'archived_at'>
): ResourceLifecycleState {
	if (isResourceArchived(resource)) {
		return 'archived';
	}

	return isResourceDraft(resource) ? 'draft' : 'live';
}

export function getResourceLifecycleLabel(
	resource: Pick<ResourceRow, 'is_draft' | 'archived_at'>
) {
	switch (getResourceLifecycleState(resource)) {
		case 'draft':
			return 'Draft';
		case 'archived':
			return 'Archived';
		default:
			return 'Live';
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

export function sortLiveResourceRows(rows: ResourceRow[]) {
	return sortResourceRows(rows.filter((row) => isResourceLive(row)));
}

export function sortInactiveResourceRows(rows: ResourceRow[]) {
	const drafts = rows
		.filter((row) => isResourceDraft(row) && !isResourceArchived(row))
		.sort((left, right) => getTime(right.updated_at) - getTime(left.updated_at));
	const archived = rows
		.filter((row) => isResourceArchived(row))
		.sort((left, right) => {
			const leftTime = getTime(left.archived_at) || getTime(left.updated_at);
			const rightTime = getTime(right.archived_at) || getTime(right.updated_at);
			return rightTime - leftTime;
		});

	return [...drafts, ...archived];
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
	const orderedRows = sortLiveResourceRows(rows);
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

function formatResourceOpenCount(openCount: number) {
	return `${openCount} open${openCount === 1 ? '' : 's'}`;
}

export function getResourceEngagementSignal(
	resource: Pick<ResourceRow, 'open_count' | 'last_opened_at' | 'created_at' | 'is_draft' | 'archived_at'>,
	now = Date.now()
): ResourceEngagementSignal {
	if (isResourceDraft(resource)) {
		return {
			label: 'Draft',
			copy: 'Hidden from members until you publish it.',
			needsAttention: false
		};
	}

	if (isResourceArchived(resource)) {
		return {
			label: 'Archived',
			copy: resource.last_opened_at
				? `Archived after ${formatResourceOpenCount(resource.open_count ?? 0)}.`
				: 'Archived before members opened it.',
			needsAttention: false
		};
	}

	if ((resource.open_count ?? 0) === 0) {
		const createdAt = getTime(resource.created_at) ?? now;
		const ageMs = Math.max(0, now - createdAt);
		const isStale = ageMs >= 14 * 24 * 60 * 60 * 1000;

		return {
			label: 'Unused',
			copy: isStale
				? 'No member opens yet. Consider refreshing the copy or moving it to archive.'
				: 'No member opens yet.',
			needsAttention: isStale
		};
	}

	const lastOpenedAt = getTime(resource.last_opened_at);
	const staleThresholdMs = 45 * 24 * 60 * 60 * 1000;
	const isStale = lastOpenedAt !== null ? now - lastOpenedAt >= staleThresholdMs : false;

	return {
		label: isStale ? 'Stale' : 'Active',
		copy: resource.last_opened_at
			? `${formatResourceOpenCount(resource.open_count ?? 0)}. Last opened ${new Date(resource.last_opened_at).toLocaleDateString()}.`
			: formatResourceOpenCount(resource.open_count ?? 0),
		needsAttention: isStale
	};
}
