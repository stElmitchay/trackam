import { callClaude } from './claude';
import {
	getRepoTree,
	getFileContent,
	getRepoInfo,
	createBranch,
	createOrUpdateFile,
	createPullRequest,
	type PullRequestResult
} from './github';

interface ImplementInput {
	token: string;
	owner: string;
	repo: string;
	milestone: {
		title: string;
		description: string;
		category: string;
	};
	projectContext: {
		title: string;
		description: string;
		tech_stack: string[];
	};
}

export interface ImplementationPlan {
	summary: string;
	files_to_modify: Array<{
		path: string;
		action: 'create' | 'update';
		description: string;
	}>;
	files_read: string[];
	approach: string;
	risks: string[];
	estimated_diff_size: string;
}

interface FileChange {
	path: string;
	content: string;
	action: 'create' | 'update';
}

interface ExecutionResult {
	files: FileChange[];
	pr_title: string;
	pr_body: string;
}

/**
 * Phase 1: Generate an implementation plan without writing any code.
 * Returns a plan the user can review before approving.
 */
export async function generateImplementationPlan(input: ImplementInput): Promise<ImplementationPlan> {
	const { token, owner, repo, milestone, projectContext } = input;

	// Get repo info and file tree
	const repoInfo = await getRepoInfo(token, owner, repo);
	const tree = await getRepoTree(token, owner, repo, repoInfo.default_branch);

	// Ask Claude which files are relevant
	const fileSelectionPrompt = `You are analyzing a ${projectContext.tech_stack.join(', ')} project to plan an implementation. Given the repo file tree and the goal, identify which files need to be read to understand the implementation context. Return ONLY a JSON array of file paths (max 10 most relevant files).

Return ONLY a JSON array (no markdown fences):
["path/to/file1", "path/to/file2"]`;

	const fileSelectionMessage = `## Goal
${milestone.title}: ${milestone.description}
Category: ${milestone.category}

## Project
${projectContext.title}: ${projectContext.description}
Tech: ${projectContext.tech_stack.join(', ')}
Languages: ${Object.keys(repoInfo.languages).join(', ')}

## Repository File Tree (${tree.length} files)
${tree.slice(0, 500).join('\n')}`;

	const fileSelectionResponse = await callClaude(fileSelectionPrompt, fileSelectionMessage);
	const filePaths: string[] = JSON.parse(
		fileSelectionResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
	);

	// Read the selected files
	const fileContents: Array<{ path: string; content: string }> = [];
	let totalSize = 0;
	const maxSize = 50_000;

	for (const path of filePaths.slice(0, 10)) {
		if (totalSize > maxSize) break;
		const content = await getFileContent(token, owner, repo, path);
		if (content) {
			fileContents.push({ path, content: content.slice(0, 10_000) });
			totalSize += content.length;
		}
	}

	// Ask Claude to generate a PLAN (not code)
	const planPrompt = `You are a senior developer planning an implementation for a ${projectContext.tech_stack.join(', ')} project. DO NOT generate code. Instead, create a detailed implementation plan describing WHAT will change and HOW.

Return ONLY a JSON object (no markdown code fences):
{
  "summary": "1-2 sentence overview of the implementation approach",
  "files_to_modify": [
    { "path": "path/to/file", "action": "create|update", "description": "what will change in this file and why" }
  ],
  "approach": "detailed technical approach — what patterns to use, how to integrate with existing code, key decisions",
  "risks": ["potential issues or edge cases to watch for"],
  "estimated_diff_size": "small (~50 lines) | medium (~200 lines) | large (~500+ lines)"
}

Be specific about what each file change involves. Reference existing code patterns from the files you've read.`;

	const planMessage = `## Goal
${milestone.title}: ${milestone.description}
Category: ${milestone.category}

## Project Context
${projectContext.title}: ${projectContext.description}

## Existing Files
${fileContents.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')}

## Full File Tree
${tree.slice(0, 200).join('\n')}

Create a detailed implementation plan. Do NOT generate code.`;

	const planResponse = await callClaude(planPrompt, planMessage);
	const plan: ImplementationPlan = JSON.parse(
		planResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
	);

	plan.files_read = fileContents.map((f) => f.path);
	plan.files_to_modify = plan.files_to_modify || [];
	plan.risks = plan.risks || [];

	return plan;
}

/**
 * Phase 2: Execute an approved plan — generate code and create a PR.
 * Uses the plan as additional context for better code generation.
 */
export async function executeImplementationPlan(
	input: ImplementInput,
	plan: ImplementationPlan
): Promise<PullRequestResult> {
	const { token, owner, repo, milestone, projectContext } = input;

	const repoInfo = await getRepoInfo(token, owner, repo);
	const tree = await getRepoTree(token, owner, repo, repoInfo.default_branch);

	// Read files referenced in the plan
	const filesToRead = [
		...plan.files_read,
		...plan.files_to_modify.filter((f) => f.action === 'update').map((f) => f.path)
	];
	const uniquePaths = [...new Set(filesToRead)];

	const fileContents: Array<{ path: string; content: string }> = [];
	let totalSize = 0;

	for (const path of uniquePaths.slice(0, 15)) {
		if (totalSize > 60_000) break;
		const content = await getFileContent(token, owner, repo, path);
		if (content) {
			fileContents.push({ path, content: content.slice(0, 10_000) });
			totalSize += content.length;
		}
	}

	// Generate implementation code using the plan as guidance
	const implementPrompt = `You are a senior developer implementing a feature for a ${projectContext.tech_stack.join(', ')} project. You have an approved implementation plan. Follow the plan precisely.

For each file, provide the COMPLETE new content (not a diff). Only include files specified in the plan.

Return ONLY a JSON object (no markdown code fences):
{
  "files": [
    { "path": "path/to/file", "content": "complete file content", "action": "create|update" }
  ],
  "pr_title": "short descriptive PR title",
  "pr_body": "markdown description of what was implemented and why"
}

Follow the plan. Do not add unnecessary changes. Keep existing code style.`;

	const implementMessage = `## Approved Implementation Plan
Summary: ${plan.summary}
Approach: ${plan.approach}
Files to modify:
${plan.files_to_modify.map((f) => `- ${f.path} (${f.action}): ${f.description}`).join('\n')}
Risks to watch: ${plan.risks.join('; ')}

## Goal
${milestone.title}: ${milestone.description}
Category: ${milestone.category}

## Project Context
${projectContext.title}: ${projectContext.description}

## Existing Files
${fileContents.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')}

## Full File Tree
${tree.slice(0, 200).join('\n')}

Implement the plan. Return the JSON with file changes.`;

	const implementResponse = await callClaude(implementPrompt, implementMessage);
	const result: ExecutionResult = JSON.parse(
		implementResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
	);

	if (!result.files?.length) {
		throw new Error('AI generated no file changes');
	}

	// Create branch, commit files, open PR
	const branchName = `raydr/implement-${milestone.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now()}`;

	await createBranch(token, owner, repo, branchName, repoInfo.default_branch);

	for (const file of result.files) {
		await createOrUpdateFile(
			token, owner, repo,
			file.path,
			file.content,
			`${file.action === 'create' ? 'feat' : 'update'}: ${milestone.title}\n\nImplemented by Raydr AI`,
			branchName
		);
	}

	const prBody = `${result.pr_body || milestone.description}

## Implementation Plan
${plan.summary}

### Files Changed
${plan.files_to_modify.map((f) => `- \`${f.path}\` (${f.action}): ${f.description}`).join('\n')}

### Approach
${plan.approach}

---
*Implemented by Raydr AI*`;

	const pr = await createPullRequest(token, owner, repo, {
		title: result.pr_title || `feat: ${milestone.title}`,
		body: prBody,
		head: branchName,
		base: repoInfo.default_branch
	});

	return pr;
}

/**
 * Legacy single-step implementation (kept for backwards compatibility).
 * Wraps plan + execute in one call.
 */
export async function implementMilestone(input: ImplementInput): Promise<PullRequestResult> {
	const plan = await generateImplementationPlan(input);
	return executeImplementationPlan(input, plan);
}
