import type { PageServerLoad } from './$types';
import { getCurrentDemoCycle } from '$lib/server/demo-cycle';
import { getDemoDayData } from '$lib/server/demo-day';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: season } = await supabase
		.from('seasons')
		.select('*')
		.eq('is_active', true)
		.single();

	const demoCycle = season
		? getCurrentDemoCycle(new Date(season.start_date))
		: 1;

	const demoDayData = await getDemoDayData(supabase, season?.id ?? null, demoCycle);

	return {
		season,
		demoCycle,
		...demoDayData
	};
};
