import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { expireOverdueClaims } from '$lib/server/expire-claims';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	await expireOverdueClaims(supabase);

	const { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!profile) {
		throw error(404, 'Builder not found');
	}

	const [
		{ data: projects },
		{ data: achievements },
		{ data: claimedRequests }
	] = await Promise.all([
		supabase
			.from('projects')
			.select('*, submitter:profiles!submitted_by(*)')
			.or(`submitted_by.eq.${params.id},team_members.cs.{${params.id}}`)
			.order('created_at', { ascending: false }),
		supabase
			.from('user_achievements')
			.select('*, achievement:achievements(*)')
			.eq('user_id', params.id),
		supabase
			.from('tool_requests')
			.select('*')
			.eq('claimed_by', params.id)
			.eq('status', 'claimed')
			.order('claimed_at', { ascending: false })
	]);

	const { data: allAchievements } = await supabase
		.from('achievements')
		.select('*');

	return {
		profile,
		projects: projects ?? [],
		earnedAchievements: achievements ?? [],
		allAchievements: allAchievements ?? [],
		claimedRequests: claimedRequests ?? []
	};
};
