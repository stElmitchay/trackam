import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { supabaseAdmin } from '$lib/server/supabase-admin';
import { parseRepoUrl, getRepoInfo, getCommitsSince, getReadmeContent, getLicenseInfo } from '$lib/server/github';
import { analyzeRepoProgress } from '$lib/server/claude';
import { evaluateDPGCompliance } from '$lib/server/dpg';
import { AI_XP_CAP_PER_CYCLE } from '$lib/constants';

export const load: PageServerLoad = async ({ params, locals: { supabase, session } }) => {
	if (!session) throw redirect(303, '/auth/login');

	const { data: project } = await supabase
		.from('projects')
		.select('*, submitter:profiles!submitted_by(*)')
		.eq('id', params.id)
		.single();

	if (!project) throw error(404, 'Project not found');
	if (project.submitted_by !== session.user.id) throw error(403, 'Only the project owner can analyze');

	const [{ data: ghConn }, { data: analyses }, { data: milestones }, { data: nextSteps }] = await Promise.all([
		supabase.from('github_connections').select('*').eq('user_id', session.user.id).single(),
		supabase.from('ai_analyses').select('*').eq('project_id', params.id).order('analyzed_at', { ascending: false }),
		supabase.from('milestones').select('*').eq('project_id', params.id).order('created_at', { ascending: false }),
		supabase.from('next_steps').select('*').eq('project_id', params.id).eq('completed', false).order('created_at', { ascending: false })
	]);

	return {
		project,
		githubConnected: !!ghConn,
		analyses: analyses ?? [],
		milestones: milestones ?? [],
		nextSteps: nextSteps ?? []
	};
};

export const actions: Actions = {
	analyze: async ({ params, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		const { data: project } = await supabase
			.from('projects')
			.select('*')
			.eq('id', params.id)
			.single();

		if (!project) return fail(404, { error: 'Project not found' });
		if (project.submitted_by !== session.user.id) return fail(403, { error: 'Not your project' });
		if (!project.repo_url) return fail(400, { error: 'No repository URL on this project' });

		const { data: ghConn } = await supabase
			.from('github_connections')
			.select('access_token')
			.eq('user_id', session.user.id)
			.single();

		if (!ghConn) return fail(400, { error: 'GitHub not connected. Go to your profile to connect.' });

		const parsed = parseRepoUrl(project.repo_url);
		if (!parsed) return fail(400, { error: 'Invalid GitHub repository URL' });

		// Determine "since" date: last analysis or project creation
		const { data: lastAnalysis } = await supabase
			.from('ai_analyses')
			.select('analyzed_at, milestones')
			.eq('project_id', params.id)
			.order('analyzed_at', { ascending: false })
			.limit(1)
			.single();

		const sinceDate = lastAnalysis
			? new Date(lastAnalysis.analyzed_at)
			: new Date(project.created_at);

		try {
			const [repoInfo, commits, readmeContent, licenseInfo] = await Promise.all([
				getRepoInfo(ghConn.access_token, parsed.owner, parsed.repo),
				getCommitsSince(ghConn.access_token, parsed.owner, parsed.repo, sinceDate),
				getReadmeContent(ghConn.access_token, parsed.owner, parsed.repo),
				getLicenseInfo(ghConn.access_token, parsed.owner, parsed.repo)
			]);

			// Run DPG evaluation first so we can pass gaps to analysis
			let dpgEvaluation = null;
			let dpgGaps: string[] = [];
			try {
				dpgEvaluation = await evaluateDPGCompliance({
					repoInfo,
					readmeContent,
					licenseInfo,
					projectContext: {
						title: project.title,
						description: project.description,
						problem_statement: project.problem_statement,
						solution_summary: project.solution_summary
					}
				});
				// Extract failing criteria as gaps for next steps
				dpgGaps = (dpgEvaluation.checklist || [])
					.filter(c => c.status === 'fail' || c.status === 'partial')
					.map(c => `- ${c.criterion}: ${c.reasoning}`);
			} catch {
				// DPG evaluation failed — continue without it
			}

			const analysis = await analyzeRepoProgress({
				commits,
				repoInfo,
				previousAnalysis: lastAnalysis,
				projectContext: {
					title: project.title,
					description: project.description,
					problem_statement: project.problem_statement,
					solution_summary: project.solution_summary
				},
				dpgGaps
			});

			// Get current season and demo cycle
			const { data: season } = await supabase
				.from('seasons')
				.select('*')
				.eq('is_active', true)
				.single();

			const demoCycle = project.demo_cycle || 1;
			const seasonId = season?.id || null;

			// Store analysis using service role
			await supabaseAdmin.from('ai_analyses').upsert({
				project_id: params.id,
				demo_cycle: demoCycle,
				season: seasonId,
				analysis_json: analysis,
				milestones: analysis.milestones.map(m => m.title),
				xp_awarded: 0,
				commit_count: commits.length,
				lines_changed: commits.reduce((sum, c) => sum + c.additions + c.deletions, 0),
				languages: repoInfo.languages,
				dpg_evaluation: dpgEvaluation
			}, { onConflict: 'project_id,demo_cycle,season' });

			// Get the stored analysis ID for linking next steps
			const { data: storedAnalysis } = await supabaseAdmin
				.from('ai_analyses')
				.select('id')
				.eq('project_id', params.id)
				.eq('demo_cycle', demoCycle)
				.eq('season', seasonId)
				.single();

			// Store individual milestones
			for (const m of analysis.milestones) {
				await supabaseAdmin.from('milestones').insert({
					project_id: params.id,
					demo_cycle: demoCycle,
					season: seasonId,
					title: m.title,
					description: m.description,
					category: m.category,
					source: 'ai',
					xp_value: m.suggested_xp
				});
			}

			// Store next steps
			if (analysis.next_steps?.length) {
				// Clear old next steps for this project/cycle
				await supabaseAdmin.from('next_steps')
					.delete()
					.eq('project_id', params.id)
					.eq('demo_cycle', demoCycle)
					.eq('completed', false);

				for (const s of analysis.next_steps) {
					await supabaseAdmin.from('next_steps').insert({
						project_id: params.id,
						analysis_id: storedAnalysis?.id || null,
						demo_cycle: demoCycle,
						season: seasonId,
						title: s.title,
						description: s.description,
						category: s.category,
						estimated_xp: s.estimated_xp
					});
				}
			}

			return { success: true, analysis };
		} catch (err: any) {
			return fail(500, { error: `Analysis failed: ${err.message}` });
		}
	},

	awardXp: async ({ params, request, locals: { supabase, session } }) => {
		if (!session) return fail(401, { error: 'Not authenticated' });

		const formData = await request.formData();
		const analysisId = formData.get('analysis_id') as string;

		const { data: analysis } = await supabaseAdmin
			.from('ai_analyses')
			.select('*')
			.eq('id', analysisId)
			.single();

		if (!analysis) return fail(404, { error: 'Analysis not found' });
		if (analysis.xp_awarded > 0) return fail(400, { error: 'XP already awarded for this analysis' });

		const xpToAward = Math.min(
			AI_XP_CAP_PER_CYCLE,
			(analysis.analysis_json as any).total_suggested_xp || 0
		);

		// Award XP and mark analysis
		await supabaseAdmin.rpc('award_analysis_xp', {
			p_user_id: session.user.id,
			p_project_id: params.id,
			p_amount: xpToAward,
			p_demo_cycle: analysis.demo_cycle,
			p_season: analysis.season
		});

		return { success: true, xpAwarded: xpToAward };
	}
};
