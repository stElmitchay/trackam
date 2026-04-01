import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getLastThursday } from '$lib/server/demo-cycle';
import { generateNewsletter } from '$lib/server/newsletter';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const cycleNum = parseInt(params.week);
	if (isNaN(cycleNum)) throw error(400, 'Invalid cycle number');

	const { data: season } = await supabase
		.from('seasons')
		.select('*')
		.eq('is_active', true)
		.single();

	if (!season) throw error(404, 'No active season');

	// Check if newsletter already exists
	const { data: existing } = await supabase
		.from('newsletters')
		.select('*')
		.eq('demo_cycle', cycleNum)
		.eq('season', season.id)
		.single();

	if (existing) {
		return { newsletter: existing, cycle: cycleNum, season };
	}

	// Only auto-generate if the cycle has ended (past demo day)
	const seasonStart = new Date(season.start_date);
	const cycleMonth = seasonStart.getMonth() + (cycleNum - 1);
	const cycleYear = seasonStart.getFullYear() + Math.floor(cycleMonth / 12);
	const normalizedMonth = cycleMonth % 12;
	const cycleDemoDay = getLastThursday(cycleYear, normalizedMonth);

	if (new Date() <= cycleDemoDay) {
		throw error(404, 'Newsletter not available yet — this demo cycle has not ended');
	}

	// Generate the newsletter on first visit after demo day
	try {
		const newsletter = await generateNewsletter(supabase, cycleNum, season.id);
		return { newsletter, cycle: cycleNum, season };
	} catch (err: any) {
		throw error(500, `Failed to generate newsletter: ${err.message}`);
	}
};
