import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [
		{ data: projects },
		{ data: profiles },
		{ data: departmentStats }
	] = await Promise.all([
		supabase
			.from('projects')
			.select('*')
			.order('created_at', { ascending: true }),
		supabase
			.from('profiles')
			.select('*'),
		supabase.rpc('get_department_stats')
	]);

	const { data: totals } = await supabase.rpc('get_totals');

	return {
		projects: projects ?? [],
		profiles: profiles ?? [],
		departmentStats: departmentStats ?? [],
		totals: totals ?? { total_cost_saved: 0, total_hours_saved: 0, total_projects: 0, active_builders: 0 }
	};
};
