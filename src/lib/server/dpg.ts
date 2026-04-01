import { callClaude } from './claude';
import type { RepoInfo } from './github';
import type { DPGEvaluation } from '$lib/types';

interface DPGInput {
	repoInfo: RepoInfo;
	readmeContent: string | null;
	licenseInfo: { license: string | null; spdx_id: string | null };
	projectContext: {
		title: string;
		description: string;
		problem_statement: string;
		solution_summary: string;
	};
}

export async function evaluateDPGCompliance(input: DPGInput): Promise<DPGEvaluation> {
	const system = `You are evaluating a software project against the Digital Public Goods (DPG) Standard. The DPG Standard has 9 indicators:

1. Relevance to Sustainable Development Goals (SDGs)
2. Use of an approved open source license
3. Clear ownership and documentation
4. Platform independence
5. Documentation quality
6. Data privacy and applicable laws compliance
7. Adherence to standards and best practices
8. Do no harm assessment
9. Open data/content/AI standards (where applicable)

Evaluate the project against each indicator based on the information provided. Be fair but thorough.

Return ONLY a JSON object (no markdown code fences) with this exact structure:
{
  "overall_score": <number 0-100>,
  "checklist": [
    {
      "criterion": "human-readable description of what's checked",
      "indicator": <number 1-9>,
      "status": "pass|fail|partial|unknown",
      "reasoning": "brief explanation"
    }
  ]
}

Include 1-2 checklist items per indicator (9-18 total items). Score overall_score as: pass=full points, partial=half, fail/unknown=0, divided across 9 indicators.`;

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

## README Content
${input.readmeContent ? input.readmeContent.slice(0, 3000) : 'No README found.'}

Evaluate this project against the 9 DPG Standard indicators.`;

	const response = await callClaude(system, userMessage);
	const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
	const result: DPGEvaluation = JSON.parse(jsonStr);

	// Clamp score
	result.overall_score = Math.max(0, Math.min(100, result.overall_score));

	return result;
}
