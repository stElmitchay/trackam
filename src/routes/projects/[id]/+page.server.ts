import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: project } = await supabase
		.from('projects')
		.select('*, submitter:profiles!submitted_by(*)')
		.eq('id', params.id)
		.single();

	if (!project) {
		throw error(404, 'Project not found');
	}

	// Fetch team member profiles
	let teamMembers: any[] = [];
	if (project.team_members && project.team_members.length > 0) {
		const { data } = await supabase
			.from('profiles')
			.select('*')
			.in('id', project.team_members);
		teamMembers = data ?? [];
	}

	return { project, teamMembers };
};
