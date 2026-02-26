import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	// Fetch profiles with project stats
	const { data: profiles } = await supabase
		.from('profiles')
		.select('*')
		.order('total_xp', { ascending: false });

	// Fetch all projects for ranking
	const { data: projects } = await supabase
		.from('projects')
		.select('*, submitter:profiles!submitted_by(*)')
		.order('annual_cost_replaced', { ascending: false });

	// Build builder rankings with project counts
	const builderStats = (profiles ?? []).map((profile, index) => {
		const userProjects = (projects ?? []).filter(p => p.submitted_by === profile.id);
		return {
			...profile,
			rank: index + 1,
			project_count: userProjects.length,
			total_saved: userProjects.reduce((s: number, p: any) => s + (p.annual_cost_replaced || 0), 0)
		};
	});

	return {
		builders: builderStats,
		projects: projects ?? []
	};
};
