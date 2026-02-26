import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { CLAIM_FULFILL_XP_REWARD } from '$lib/constants';

export const load: PageServerLoad = async ({ locals: { session, supabase } }) => {
	if (!session) {
		throw redirect(303, '/auth/login');
	}

	const { data: claimedRequests } = await supabase
		.from('tool_requests')
		.select('id, title, bonus_xp')
		.eq('claimed_by', session.user.id)
		.eq('status', 'claimed');

	return { claimedRequests: claimedRequests ?? [] };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		// Ensure profile exists before inserting project (fixes FK constraint)
		const { data: existingProfile } = await supabase
			.from('profiles')
			.select('id')
			.eq('id', session.user.id)
			.single();

		if (!existingProfile) {
			const { error: profileError } = await supabase
				.from('profiles')
				.upsert({
					id: session.user.id,
					email: session.user.email ?? '',
					full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
					department: ''
				});

			if (profileError) {
				return fail(500, { error: `Could not create your profile: ${profileError.message}` });
			}
		}

		const formData = await request.formData();
		const title = formData.get('title') as string;
		const description = formData.get('description') as string;
		const problem_statement = formData.get('problem_statement') as string;
		const solution_summary = formData.get('solution_summary') as string;
		const replaces_tool = formData.get('replaces_tool') as string;
		const annual_cost_replaced = Number(formData.get('annual_cost_replaced')) || 0;
		const estimated_hours_saved_weekly = Number(formData.get('estimated_hours_saved_weekly')) || 0;
		const demo_url = formData.get('demo_url') as string;
		const repo_url = formData.get('repo_url') as string;
		const tech_stack = (formData.get('tech_stack') as string)?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
		const ai_tools_used = (formData.get('ai_tools_used') as string)?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
		const tool_request_id = (formData.get('tool_request_id') as string) || null;

		if (!title || !description || !problem_statement || !solution_summary) {
			return fail(400, { error: 'Title, description, problem, and solution are required' });
		}

		// Get active season and calculate current week
		const { data: activeSeason } = await supabase
			.from('seasons')
			.select('*')
			.eq('is_active', true)
			.single();

		let seasonId = activeSeason?.id ?? null;
		let week = 1;
		if (activeSeason) {
			const start = new Date(activeSeason.start_date);
			const now = new Date();
			week = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)));
		}

		const { data, error } = await supabase.from('projects').insert({
			title,
			description,
			problem_statement,
			solution_summary,
			replaces_tool: replaces_tool || null,
			annual_cost_replaced,
			estimated_hours_saved_weekly,
			demo_url: demo_url || null,
			repo_url: repo_url || null,
			tech_stack,
			ai_tools_used,
			submitted_by: session.user.id,
			season: seasonId,
			week,
			status: 'submitted',
			tool_request_id
		}).select().single();

		if (error) return fail(500, { error: error.message });

		// If this project fulfills a claimed request, mark it completed and award XP (base + bounty)
		if (tool_request_id) {
			const { data: fulfilledReq } = await supabase
				.from('tool_requests')
				.select('bonus_xp')
				.eq('id', tool_request_id)
				.single();

			await supabase
				.from('tool_requests')
				.update({ status: 'completed' })
				.eq('id', tool_request_id)
				.eq('claimed_by', session.user.id);

			const totalReward = CLAIM_FULFILL_XP_REWARD + (fulfilledReq?.bonus_xp ?? 0);
			await supabase.rpc('add_xp', { user_id: session.user.id, amount: totalReward });
		}

		throw redirect(303, `/projects/${data.id}`);
	}
};
