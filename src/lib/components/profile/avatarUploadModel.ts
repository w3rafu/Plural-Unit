export function createAvatarPreview(file: File): string {
	return URL.createObjectURL(file);
}

export function revokeAvatarPreview(url: string): void {
	if (url.startsWith('blob:')) {
		URL.revokeObjectURL(url);
	}
}

export function validateAvatarFile(file: File | null): string {
	if (!file) return '';
	if (!file.type.startsWith('image/')) {
		return 'Choose a PNG, JPEG, or WebP image.';
	}
	return '';
}

export function computeAvatarInitials(...sources: (string | null | undefined)[]): string {
	for (const source of sources) {
		if (!source?.trim()) continue;

		const parts = source
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2);

		if (parts.length > 0) {
			return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
		}
	}

	return '?';
}
