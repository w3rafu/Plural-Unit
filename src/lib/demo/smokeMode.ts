import { getHubSchemaDriftRecoveryCopy } from '$lib/models/hubRecoveryGuidance';

const SMOKE_MODE_SESSION_KEY = 'plural-unit:smoke-mode';
const SMOKE_MODE_QUERY_KEY = 'smoke';
const SMOKE_MODE_SCENARIO_SESSION_KEY = 'plural-unit:smoke-mode-scenario';
const SMOKE_MODE_SCENARIO_QUERY_KEY = 'smokeScenario';

export const DEFAULT_SMOKE_MODE_SCENARIO = 'default';
export const STALE_HUB_SCHEMA_SMOKE_MODE_SCENARIO = 'stale-hub-schema';
export const STALE_WORKFLOW_SCHEMA_SMOKE_MODE_SCENARIO = 'stale-workflow-schema';

export type SmokeModeScenario =
	| typeof DEFAULT_SMOKE_MODE_SCENARIO
	| typeof STALE_HUB_SCHEMA_SMOKE_MODE_SCENARIO
	| typeof STALE_WORKFLOW_SCHEMA_SMOKE_MODE_SCENARIO;

const STALE_HUB_SCHEMA_SMOKE_MODE_MESSAGE = 'column hub_events.delivery_state does not exist';
const STALE_WORKFLOW_SCHEMA_SMOKE_MODE_MESSAGE =
	'relation "public"."hub_operator_workflow_state" does not exist';

function parseSmokeModeValue(value: string | null) {
	if (value === null) {
		return null;
	}

	const normalizedValue = value.trim().toLowerCase();
	if (normalizedValue === '0' || normalizedValue === 'false' || normalizedValue === 'off') {
		return false;
	}

	return true;
}

function readExplicitSmokeMode(search: string) {
	return parseSmokeModeValue(new URLSearchParams(search).get(SMOKE_MODE_QUERY_KEY));
}

function normalizeSmokeModeScenario(value: string | null): SmokeModeScenario {
	if (value === STALE_WORKFLOW_SCHEMA_SMOKE_MODE_SCENARIO) {
		return STALE_WORKFLOW_SCHEMA_SMOKE_MODE_SCENARIO;
	}

	return value === STALE_HUB_SCHEMA_SMOKE_MODE_SCENARIO
		? STALE_HUB_SCHEMA_SMOKE_MODE_SCENARIO
		: DEFAULT_SMOKE_MODE_SCENARIO;
}

function readExplicitSmokeModeScenario(search: string) {
	const rawValue = new URLSearchParams(search).get(SMOKE_MODE_SCENARIO_QUERY_KEY);
	return rawValue === null ? null : normalizeSmokeModeScenario(rawValue);
}

export function syncSmokeModeFromSearch(search: string) {
	if (typeof window === 'undefined') {
		return false;
	}

	const explicitValue = readExplicitSmokeMode(search);
	const explicitScenario = readExplicitSmokeModeScenario(search);
	if (explicitValue === true) {
		sessionStorage.setItem(SMOKE_MODE_SESSION_KEY, '1');
		sessionStorage.setItem(
			SMOKE_MODE_SCENARIO_SESSION_KEY,
			explicitScenario ?? DEFAULT_SMOKE_MODE_SCENARIO
		);
	} else if (explicitValue === false) {
		sessionStorage.removeItem(SMOKE_MODE_SESSION_KEY);
		sessionStorage.removeItem(SMOKE_MODE_SCENARIO_SESSION_KEY);
	} else if (sessionStorage.getItem(SMOKE_MODE_SESSION_KEY) === '1' && explicitScenario !== null) {
		sessionStorage.setItem(SMOKE_MODE_SCENARIO_SESSION_KEY, explicitScenario);
	}

	return sessionStorage.getItem(SMOKE_MODE_SESSION_KEY) === '1';
}

export function syncSmokeModeFromUrl(url: Pick<URL, 'search'> | Pick<Location, 'search'>) {
	return syncSmokeModeFromSearch(url.search);
}

export function isSmokeModeEnabled() {
	// prototype/0.2 — always run in demo mode so all routes show fixture data without login.
	return true;
}

export function getSmokeModeScenario(): SmokeModeScenario {
	if (!isSmokeModeEnabled() || typeof window === 'undefined') {
		return DEFAULT_SMOKE_MODE_SCENARIO;
	}

	return normalizeSmokeModeScenario(
		sessionStorage.getItem(SMOKE_MODE_SCENARIO_SESSION_KEY)
	);
}

export function shouldHydrateSmokeHubState() {
	return isSmokeModeEnabled() && getSmokeModeScenario() === DEFAULT_SMOKE_MODE_SCENARIO;
}

export function getSmokeModeHubLoadError() {
	if (!isSmokeModeEnabled()) {
		return null;
	}

	const scenario = getSmokeModeScenario();
	const smokeModeMessage =
		scenario === STALE_HUB_SCHEMA_SMOKE_MODE_SCENARIO
			? STALE_HUB_SCHEMA_SMOKE_MODE_MESSAGE
			: scenario === STALE_WORKFLOW_SCHEMA_SMOKE_MODE_SCENARIO
				? STALE_WORKFLOW_SCHEMA_SMOKE_MODE_MESSAGE
				: null;

	if (!smokeModeMessage) {
		return null;
	}

	return new Error(
		`${smokeModeMessage} ${getHubSchemaDriftRecoveryCopy(smokeModeMessage)}`
	);
}
