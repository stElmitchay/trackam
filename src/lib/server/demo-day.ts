import { getLastThursday, getCurrentDemoCycle } from './demo-cycle';
import type { SupabaseClient } from '@supabase/supabase-js';

export function isDemoDay(): boolean {
	const now = new Date();
	const lastThursday = getLastThursday(now.getFullYear(), now.getMonth());
	return (
		now.getFullYear() === lastThursday.getFullYear() &&
		now.getMonth() === lastThursday.getMonth() &&
		now.getDate() === lastThursday.getDate()
	);
}

export async function getDemoDayData(supabase: SupabaseClient, seasonId: number | null, demoCycle: number) {
	const [
		{ data: projects },
		{ data: milestones },
		{ data: profiles }
	] = await Promise.all([
		supabase
			.from('projects')
			.select('*, submitter:profiles!submitted_by(*)')
			.eq('demo_cycle', demoCycle)
			.in('status', ['submitted', 'featured'])
			.order('created_at', { ascending: false }),
		supabase
			.from('milestones')
			.select('*, project:projects(title)')
			.eq('demo_cycle', demoCycle)
			.order('created_at', { ascending: false })
			.limit(30),
		supabase
			.from('profiles')
			.select('*')
			.order('total_xp', { ascending: false })
			.limit(10)
	]);

	const projectList = projects ?? [];
	const departments = new Set(projectList.map((p: any) => p.submitter?.department).filter(Boolean));

	const totalXpAwarded = await supabase
		.from('ai_analyses')
		.select('xp_awarded')
		.eq('demo_cycle', demoCycle);

	const xpSum = (totalXpAwarded.data ?? []).reduce((sum: number, a: any) => sum + (a.xp_awarded || 0), 0);

	return {
		projects: projectList,
		milestones: milestones ?? [],
		leaderboard: profiles ?? [],
		stats: {
			projectCount: projectList.length,
			milestoneCount: (milestones ?? []).length,
			xpAwarded: xpSum,
			departmentCount: departments.size
		}
	};
}
