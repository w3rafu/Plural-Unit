import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	throw redirect(307, `/directory/${params.memberId}`);
}