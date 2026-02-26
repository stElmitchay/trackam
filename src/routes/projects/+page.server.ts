import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const status = url.searchParams.get('status') || 'all';
	const sort = url.searchParams.get('sort') || 'newest';
	const search = url.searchParams.get('q') || '';

	let query = supabase
		.from('projects')
		.select('*, submitter:profiles!submitted_by(*)');

	if (status !== 'all') {
		query = query.eq('status', status);
	}

	if (search) {
		query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
	}

	switch (sort) {
		case 'cost':
			query = query.order('annual_cost_replaced', { ascending: false });
			break;
		case 'hours':
			query = query.order('estimated_hours_saved_weekly', { ascending: false });
			break;
		case 'adoption':
			query = query.order('adoption_count', { ascending: false });
			break;
		default:
			query = query.order('created_at', { ascending: false });
	}

	const { data: projects } = await query;

	return { projects: projects ?? [] };
};
