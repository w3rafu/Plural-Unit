/**
 * User identity and profile fields.
 *
 * `id` comes from Supabase Auth.
 * `name` and `email` are the editable profile fields.
 */
export type UserDetails = {
	id: string;
	name: string;
	email: string;
	phone_number: string;
	avatar_url: string;
	bio: string;
	deletion_requested_at: string | null;
	deletion_reviewed_at: string | null;
	deletion_reviewed_by: string | null;
};

/** Empty placeholder used before the real profile is loaded from Supabase. */
export const INITIAL_DETAILS: UserDetails = {
	id: '',
	name: '',
	email: '',
	phone_number: '',
	avatar_url: '',
	bio: '',
	deletion_requested_at: null,
	deletion_reviewed_at: null,
	deletion_reviewed_by: null
};
