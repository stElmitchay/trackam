import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: profiles } = await supabase
		.from('profiles')
		.select('*')
		.order('total_xp', { ascending: false });

	// Get project counts per builder
	const { data: projects } = await supabase
		.from('projects')
		.select('submitted_by');

	const projectCounts: Record<string, number> = {};
	for (const p of projects ?? []) {
		if (p.submitted_by) {
			projectCounts[p.submitted_by] = (projectCounts[p.submitted_by] || 0) + 1;
		}
	}

	const enrichedProfiles = (profiles ?? []).map(p => ({
		...p,
		project_count: projectCounts[p.id] ?? 0
	}));

	return { profiles: enrichedProfiles };
};
