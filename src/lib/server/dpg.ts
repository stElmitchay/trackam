import { callClaude } from './claude';
import type { RepoInfo, TreeEntry } from './github';
import type { DPGEvaluation } from '$lib/types';
import { buildDPGEvaluationPrompt } from './dpg-criteria';

interface DPGInput {
	repoInfo: RepoInfo;
	readmeContent: string | null;
	licenseInfo: { license: string | null; spdx_id: string | null };
	fileTree: TreeEntry[];
	keyFiles: Array<{ path: string; content: string }>;
	projectContext: {
		title: string;
		description: string;
		problem_statement: string;
		solution_summary: string;
	};
}

export async function evaluateDPGCompliance(input: DPGInput): Promise<DPGEvaluation> {
	const system = buildDPGEvaluationPrompt();

	const treeList = input.fileTree
		.slice(0, 500)
		.map((f) => `${f.path} (${f.size}b)`)
		.join('\n');

	const keyFilesSection = input.keyFiles
		.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
		.join('\n\n');

	const userMessage = `## Project Details
Title: ${input.projectContext.title}
Description: ${input.projectContext.description}
Problem: ${input.projectContext.problem_statement}
Solution: ${input.projectContext.solution_summary}

## Repository Info
Languages: ${Object.keys(input.repoInfo.languages).join(', ')}
Visibility: ${input.repoInfo.visibility}
Stars: ${input.repoInfo.stargazers_count}
Has README: ${input.repoInfo.has_readme}
Description: ${input.repoInfo.description || 'None'}

## License
Detected: ${input.licenseInfo.license || 'None'}
SPDX ID: ${input.licenseInfo.spdx_id || 'None'}

## Repository File Tree (${input.fileTree.length} files)
${treeList}

## README Content
${input.readmeContent ? input.readmeContent.slice(0, 4000) : 'No README found.'}

## Key Source Files
${keyFilesSection}

Evaluate this project against all 9 DPG Standard criteria using the code evidence above. Remember: code over claims.`;

	const response = await callClaude(system, userMessage);
	const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
	const result: DPGEvaluation = JSON.parse(jsonStr);

	// Enforce binary status and recalculate passing_count
	result.checklist = (result.checklist || []).map((item) => ({
		...item,
		status: item.status === 'pass' ? 'pass' : 'fail'
	}));
	result.passing_count = result.checklist.filter((c) => c.status === 'pass').length;

	if (result.passing_count >= 7) result.approval_likelihood = 'high';
	else if (result.passing_count >= 4) result.approval_likelihood = 'medium';
	else result.approval_likelihood = 'low';

	result.priority_actions = result.priority_actions || [];

	return result;
}
