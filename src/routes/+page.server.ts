import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [
		{ data: projects },
		{ data: departmentStats },
		{ data: recentProjects }
	] = await Promise.all([
		supabase
			.from('projects')
			.select('*, submitter:profiles!submitted_by(*)')
			.eq('status', 'featured')
			.order('created_at', { ascending: false }),
		supabase.rpc('get_department_stats'),
		supabase
			.from('projects')
			.select('*, submitter:profiles!submitted_by(*)')
			.order('created_at', { ascending: false })
			.limit(5)
	]);

	// Aggregate totals
	const { data: totals } = await supabase.rpc('get_totals');

	return {
		featuredProjects: projects ?? [],
		departmentStats: departmentStats ?? [],
		recentProjects: recentProjects ?? [],
		totals: totals ?? { total_cost_saved: 0, total_hours_saved: 0, total_adoptions: 0, total_projects: 0, active_builders: 0 }
	};
};
