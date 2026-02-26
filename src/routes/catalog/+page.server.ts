import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: projects } = await supabase
		.from('projects')
		.select('*, submitter:profiles!submitted_by(*)')
		.order('adoption_count', { ascending: false });

	return { projects: projects ?? [] };
};
