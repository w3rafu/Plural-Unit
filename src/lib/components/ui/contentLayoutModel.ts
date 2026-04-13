const LOCKED_CONTENT_ROUTE_PREFIXES = [
	'/messages',
	'/directory',
	'/demo/messages',
	'/demo/directory'
] as const;

function matchesRoutePrefix(pathname: string, prefix: string) {
	return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isLockedContentRoute(pathname: string) {
	return LOCKED_CONTENT_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(pathname, prefix));
}

export { LOCKED_CONTENT_ROUTE_PREFIXES };