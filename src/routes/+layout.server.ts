import type { LayoutServerLoad } from './$types';
import { isDemoDay } from '$lib/server/demo-day';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, locals }) => {
	const { session, user } = await safeGetSession();

	let profile = null;
	let currentSeason = null;

	if (user) {
		const { data } = await locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.single();

		if (data) {
			profile = data;
		} else {
			// Profile doesn't exist — create it (requires INSERT RLS policy on profiles)
			const { data: newProfile, error } = await locals.supabase
				.from('profiles')
				.upsert({
					id: user.id,
					email: user.email ?? '',
					full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
					department: ''
				})
				.select()
				.single();

			if (!error && newProfile) {
				profile = newProfile;
			}
			// If upsert failed (e.g. missing RLS policy), profile stays null.
			// The submit action also has a fallback to create the profile.
		}
	}

	const { data: season } = await locals.supabase
		.from('seasons')
		.select('*')
		.eq('is_active', true)
		.single();
	currentSeason = season;

	return { session, user, profile, currentSeason, isDemoDay: isDemoDay() };
};
