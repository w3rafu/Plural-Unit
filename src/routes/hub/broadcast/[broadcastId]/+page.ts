import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	return { broadcastId: params.broadcastId };
};