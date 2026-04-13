import { supabaseAdmin } from './supabase-admin';
import {
	parseRepoUrl,
	getRepoInfo,
	getCommitsSince,
	getReadmeContent,
	getLicenseInfo,
	getCompareData,
	getRepoTreeWithSizes,
	getSampleFiles,
	type TreeEntry
} from './github';
import { analyzeRepoProgress } from './claude';
import { evaluateDPGCompliance } from './dpg';
import { evaluateIdea } from './idea-eval';
import { synthesizeEvaluations } from './synthesis';
import { getCurrentDemoCycle } from './demo-cycle';

/**
 * Run a full project analysis: GitHub data → DPG eval + Idea eval (parallel) → Progress analysis → Synthesis → store results.
 * Can be called from the submit flow (fire-and-forget) or from the analyze page (awaited).
 */
export async function runProjectAnalysis(projectId: string, userId: string): Promise<void> {
	// Fetch project
	const { data: project } = await supabaseAdmin
		.from('projects')
		.select('*')
		.eq('id', projectId)
		.single();

	if (!project?.repo_url) return;

	// Mark as analyzing
	await supabaseAdmin
		.from('projects')
		.update({ analysis_status: 'analyzing', updated_at: new Date().toISOString() })
		.eq('id', projectId);

	try {
		// Get GitHub connection
		const { data: ghConn } = await supabaseAdmin
			.from('github_connections')
			.select('access_token')
			.eq('user_id', userId)
			.single();

		if (!ghConn?.access_token) throw new Error('GitHub not connected — no access token found');

		const parsed = parseRepoUrl(project.repo_url);
		if (!parsed) throw new Error('Invalid repository URL');

		// Get last analysis for "since" date and base SHA
		const { data: lastAnalysis } = await supabaseAdmin
			.from('ai_analyses')
			.select('id, analyzed_at, milestones, commit_sha')
			.eq('project_id', projectId)
			.order('analyzed_at', { ascending: false })
			.limit(1)
			.single();

		const sinceDate = lastAnalysis
			? new Date(lastAnalysis.analyzed_at)
			: new Date(project.created_at);

		// Get pending next_steps (goals from previous cycles)
		const { data: pendingSteps } = await supabaseAdmin
			.from('next_steps')
			.select('id, title, description, estimated_xp')
			.eq('project_id', projectId)
			.eq('completed', false);

		// Fetch GitHub data in parallel — including new code-reading capabilities
		const [repoInfo, commits, readmeContent, licenseInfo] = await Promise.all([
			getRepoInfo(ghConn.access_token, parsed.owner, parsed.repo),
			getCommitsSince(ghConn.access_token, parsed.owner, parsed.repo, sinceDate),
			getReadmeContent(ghConn.access_token, parsed.owner, parsed.repo),
			getLicenseInfo(ghConn.access_token, parsed.owner, parsed.repo)
		]);

		// Get file tree and sample key files
		const fileTree = await getRepoTreeWithSizes(
			ghConn.access_token,
			parsed.owner,
			parsed.repo,
			repoInfo.default_branch
		);

		const keyFiles = await getSampleFiles(
			ghConn.access_token,
			parsed.owner,
			parsed.repo,
			fileTree
		);

		// Get code diffs — compare last analysis to current HEAD
		let codeDiffs = '';
		const headSha = commits.length > 0 ? commits[0].sha : null;

		if (lastAnalysis?.commit_sha && headSha) {
			try {
				const compareData = await getCompareData(
					ghConn.access_token,
					parsed.owner,
					parsed.repo,
					lastAnalysis.commit_sha,
					headSha
				);
				codeDiffs = compareData.diff;
			} catch {
				// Compare failed (e.g., force push rewrote history) — fall back to no diffs
			}
		} else if (commits.length > 0) {
			// Initial analysis — try to get diff from first commit to HEAD
			const oldestCommit = commits[commits.length - 1];
			try {
				const compareData = await getCompareData(
					ghConn.access_token,
					parsed.owner,
					parsed.repo,
					oldestCommit.sha,
					commits[0].sha
				);
				codeDiffs = compareData.diff;
			} catch {
				// Fall back gracefully
			}
		}

		// DPG gaps for progress analysis context
		const dpgGapsList: string[] = [];

		// Run DPG eval and Idea eval in PARALLEL (they're independent)
		const [dpgEvaluation, ideaEvaluation] = await Promise.all([
			evaluateDPGCompliance({
				repoInfo,
				readmeContent,
				licenseInfo,
				fileTree,
				keyFiles,
				projectContext: {
					title: project.title,
					description: project.description,
					problem_statement: project.problem_statement,
					solution_summary: project.solution_summary
				}
			}).catch(() => null),
			evaluateIdea({
				projectContext: {
					title: project.title,
					description: project.description,
					problem_statement: project.problem_statement,
					solution_summary: project.solution_summary,
					project_goals: project.project_goals,
					target_audience: project.target_audience,
					tech_stack: project.tech_stack,
					project_type: project.project_type
				}
			}).catch(() => null)
		]);

		// Extract DPG gaps for progress analysis context
		if (dpgEvaluation) {
			for (const c of dpgEvaluation.checklist) {
				if (c.status === 'fail') {
					dpgGapsList.push(`- Criterion ${c.indicator} (${c.criterion}): ${c.recommendation}`);
				}
			}
		}

		// Run progress analysis with actual code diffs
		const fileTreePaths = fileTree.map((f) => f.path);
		const analysis = await analyzeRepoProgress({
			commits,
			repoInfo,
			codeDiffs,
			fileTree: fileTreePaths,
			keyFileContents: keyFiles,
			previousAnalysis: lastAnalysis,
			pendingSteps: (pendingSteps ?? []).map((s) => ({ title: s.title, description: s.description })),
			projectContext: {
				title: project.title,
				description: project.description,
				problem_statement: project.problem_statement,
				solution_summary: project.solution_summary
			},
			dpgGaps: dpgGapsList
		});

		// Synthesis — sole source of next steps
		let synthesis = null;
		try {
			synthesis = await synthesizeEvaluations({
				ideaEval: ideaEvaluation,
				dpgEval: dpgEvaluation,
				progressAnalysis: analysis,
				existingUnfulfilledSteps: (pendingSteps ?? []).map((s) => ({
					title: s.title,
					description: s.description
				})),
				projectContext: {
					title: project.title,
					description: project.description,
					problem_statement: project.problem_statement,
					solution_summary: project.solution_summary
				}
			});
		} catch {
			// Synthesis failed — no new next steps this cycle, existing ones persist
		}

		// Get season + demo cycle
		const { data: season } = await supabaseAdmin
			.from('seasons')
			.select('*')
			.eq('is_active', true)
			.single();

		const demoCycle = season
			? getCurrentDemoCycle(new Date(season.start_date))
			: (project.demo_cycle || 1);
		const seasonId = season?.id || null;

		// Store analysis
		const { data: storedAnalysis } = await supabaseAdmin.from('ai_analyses').upsert({
			project_id: projectId,
			demo_cycle: demoCycle,
			season: seasonId,
			analysis_json: analysis,
			milestones: analysis.milestones.map((m) => m.title),
			xp_awarded: 0,
			commit_count: commits.length,
			commit_sha: headSha,
			lines_changed: commits.reduce((sum, c) => sum + c.additions + c.deletions, 0),
			languages: repoInfo.languages,
			dpg_evaluation: dpgEvaluation,
			idea_evaluation: ideaEvaluation,
			synthesis: synthesis
		}, { onConflict: 'project_id,demo_cycle,season' }).select('id').single();

		const analysisId = storedAnalysis?.id;

		// Store milestones
		for (const m of analysis.milestones) {
			await supabaseAdmin.from('milestones').insert({
				project_id: projectId,
				demo_cycle: demoCycle,
				season: seasonId,
				title: m.title,
				description: m.description,
				category: m.category,
				source: 'ai',
				xp_value: m.suggested_xp
			});
		}

		// Mark fulfilled steps as completed and award XP
		if (analysis.fulfilled_step_titles.length > 0 && pendingSteps?.length) {
			for (const step of pendingSteps) {
				if (analysis.fulfilled_step_titles.includes(step.title)) {
					await supabaseAdmin
						.from('next_steps')
						.update({
							completed: true,
							completed_at: new Date().toISOString(),
							fulfilled_by_analysis: analysisId
						})
						.eq('id', step.id);

					// Award XP for fulfilling the step
					await supabaseAdmin.rpc('add_xp', {
						user_id: userId,
						amount: step.estimated_xp
					});
				}
			}
		}

		// Add NEW next steps from synthesis (don't delete existing unfulfilled ones)
		if (synthesis?.priority_milestones?.length) {
			// Get existing unfulfilled AI step titles to avoid duplicates
			const existingTitles = new Set(
				(pendingSteps ?? [])
					.filter((s) => !analysis.fulfilled_step_titles.includes(s.title))
					.map((s) => s.title.toLowerCase().trim())
			);

			for (const s of synthesis.priority_milestones) {
				// Skip if a very similar step already exists
				const normalizedTitle = s.title.toLowerCase().trim();
				if (existingTitles.has(normalizedTitle)) continue;

				await supabaseAdmin.from('next_steps').insert({
					project_id: projectId,
					analysis_id: analysisId,
					demo_cycle: demoCycle,
					season: seasonId,
					title: s.title,
					description: s.description,
					done_when: s.done_when || null,
					addresses: s.addresses || null,
					category: s.category,
					source: 'ai',
					estimated_xp: s.estimated_xp
				});

				existingTitles.add(normalizedTitle);
			}
		}

		// Mark as completed
		await supabaseAdmin
			.from('projects')
			.update({ analysis_status: 'completed', updated_at: new Date().toISOString() })
			.eq('id', projectId);
	} catch (err) {
		// Reset status so the project isn't stuck in 'analyzing' forever
		await supabaseAdmin
			.from('projects')
			.update({ analysis_status: 'failed', updated_at: new Date().toISOString() })
			.eq('id', projectId);
		throw err;
	}
}

/**
 * Fire-and-forget wrapper — kicks off analysis without blocking.
 */
export function triggerBackgroundAnalysis(projectId: string, userId: string): void {
	runProjectAnalysis(projectId, userId).catch(async (err) => {
		console.error(`Background analysis failed for project ${projectId}:`, err);
		try {
			await supabaseAdmin
				.from('projects')
				.update({ analysis_status: 'failed' })
				.eq('id', projectId);
		} catch {
			// Ignore failure to update status
		}
	});
}
