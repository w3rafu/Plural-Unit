import type { OrganizationMember } from '$lib/models/organizationModel';
import { formatContact, formatJoinedVia } from '$lib/models/memberManagementHelpers';

export function getMemberDirectoryRoleLabel(role: OrganizationMember['role']): string {
	return role === 'admin' ? 'Admin' : 'Member';
}

export function getMemberDirectoryRoleOptions(members: OrganizationMember[]): string[] {
	const roles = new Set<string>();

	for (const member of members) {
		roles.add(getMemberDirectoryRoleLabel(member.role));
	}

	return Array.from(roles).sort((left, right) => {
		if (left === right) return 0;
		if (left === 'Admin') return -1;
		if (right === 'Admin') return 1;
		return left.localeCompare(right);
	});
}

export function filterMemberDirectory(
	members: OrganizationMember[],
	options: {
		query: string;
		roleFilter?: string;
		currentUserId: string;
	}
): OrganizationMember[] {
	const normalizedQuery = options.query.trim().toLowerCase();
	const normalizedRole = (options.roleFilter ?? '').trim().toLowerCase();

	return members
		.filter((member) => {
			if (normalizedRole) {
				const roleLabel = getMemberDirectoryRoleLabel(member.role).toLowerCase();
				if (roleLabel !== normalizedRole) {
					return false;
				}
			}

			if (!normalizedQuery) {
				return true;
			}

			const haystack = [
				member.name,
				member.email,
				member.phone_number,
				getMemberDirectoryRoleLabel(member.role),
				formatJoinedVia(member)
			]
				.join(' ')
				.toLowerCase();

			return haystack.includes(normalizedQuery);
		})
		.sort((left, right) => {
			const leftIsCurrentUser = left.profile_id === options.currentUserId;
			const rightIsCurrentUser = right.profile_id === options.currentUserId;

			if (leftIsCurrentUser !== rightIsCurrentUser) {
				return leftIsCurrentUser ? -1 : 1;
			}

			const leftName = left.name.trim() || formatContact(left);
			const rightName = right.name.trim() || formatContact(right);
			return leftName.localeCompare(rightName);
		});
}

export function buildMemberDirectorySummary(
	query: string,
	visibleCount: number,
	totalCount: number
): string {
	const trimmedQuery = query.trim();

	if (trimmedQuery) {
		return `${visibleCount} result${visibleCount === 1 ? '' : 's'} for "${trimmedQuery}"`;
	}

	return `${totalCount} member${totalCount === 1 ? '' : 's'}`;
}

export function getMemberDirectoryEmptyState(query: string): {
	title: string;
	description: string;
} {
	if (query.trim()) {
		return {
			title: 'No matches found',
			description: 'Try a different name, role, or contact detail.'
		};
	}

	return {
		title: 'No members yet',
		description: 'Members will appear here after they join or accept an invitation.'
	};
}

export function getMemberDirectoryMeta(
	member: OrganizationMember,
	currentUserId: string
): string {
	const parts = [];

	if (member.profile_id === currentUserId) {
		parts.push('You');
	}

	parts.push(getMemberDirectoryRoleLabel(member.role));
	parts.push(formatJoinedVia(member));

	return parts.join(' • ');
}

export function getMemberDirectoryContactFields(member: OrganizationMember): Array<{
	label: string;
	value: string;
}> {
	const fields: Array<{ label: string; value: string }> = [];

	if (member.email) {
		fields.push({ label: 'Email', value: member.email });
	}

	if (member.phone_number) {
		fields.push({ label: 'Phone', value: member.phone_number });
	}

	return fields;
}