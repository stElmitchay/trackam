/**
 * DPG Standard evaluation criteria — ported from christex-foundation/dpg-evaluator.
 * Each criterion is a detailed prompt template that instructs Claude to evaluate
 * a project against one of the 9 DPG indicators using actual code evidence.
 *
 * Philosophy: "Code over claims" — documentation describing unimplemented features
 * counts AGAINST the project, not for it.
 */

export interface CriterionPrompt {
	indicator: number;
	name: string;
	prompt: string;
}

/**
 * Build the full set of 9 criterion evaluation instructions.
 * Each prompt expects the caller to provide: file tree, key file contents, README, license info.
 */
export const DPG_CRITERIA: CriterionPrompt[] = [
	{
		indicator: 1,
		name: 'SDG Relevance',
		prompt: `Evaluate whether this project demonstrates genuine relevance to one or more Sustainable Development Goals (SDGs) through actual code implementation.

ANALYSIS APPROACH:
1. Understand the project's core purpose from its entry points and package files — what does it actually DO?
2. Search for implemented features addressing SDG challenges:
   - SDG 1/8: Payment systems, financial tools, job platforms, economic empowerment
   - SDG 2: Food distribution, agricultural tools, nutrition tracking
   - SDG 3: Health tracking, medical records, telemedicine, mental health
   - SDG 4: Learning management, assessments, skill development, educational games
   - SDG 5: Gender-specific needs, safety tools, inclusive design
   - SDG 6/7: Water management, energy tracking, resource optimization
   - SDG 9/11: Infrastructure management, urban planning, innovation platforms
   - SDG 13/15: Environmental monitoring, carbon tracking, conservation
   - SDG 16: Governance, voting, transparency, legal aid
   - SDG 17: Collaboration platforms, data sharing, partnerships
3. For each SDG-relevant feature found, verify it's actually implemented: trace imports, check for tests, examine data models, find UI components
4. Compare code against documentation — are claimed features real?

PASS if: Clear, implemented features address specific SDG challenges with working code that could genuinely impact SDG outcomes.
FAIL if: Only documentation mentions SDGs without corresponding code, generic software without clear SDG application, or placeholder features.`
	},
	{
		indicator: 2,
		name: 'Open Licensing',
		prompt: `Verify that this project uses proper open source licensing meeting Digital Public Good standards.

ANALYSIS APPROACH:
1. Find license files (LICENSE, LICENSE.md, COPYING, etc.)
2. Identify the license type — must be OSI-approved (MIT, Apache 2.0, GPL, LGPL, BSD, MPL 2.0, ISC, AGPL) or Creative Commons (CC0, CC BY, CC BY-SA)
3. Verify license implementation consistency:
   - Does package.json/pyproject.toml/Cargo.toml "license" field match?
   - Do source file headers (if present) match the main license?
   - Does README mention the correct license?
4. Check for issues:
   - Is the license text complete and unmodified?
   - Is a copyright holder identified?
   - Are there incompatible dependency licenses?
   - Is there conflicting dual licensing without explanation?

PASS if: Valid OSI-approved or CC license present, complete text, consistent declarations, clear copyright attribution.
FAIL if: No license, proprietary/custom license, incomplete text, conflicting declarations, or restrictive terms preventing reuse.`
	},
	{
		indicator: 3,
		name: 'Clear Ownership',
		prompt: `Verify that this project has clearly defined ownership with identifiable organizations or individuals responsible for it.

ANALYSIS APPROACH:
1. Check legal ownership: copyright statements in LICENSE, NOTICE, AUTHORS, CONTRIBUTORS files
2. Check project metadata: "author"/"contributors"/"maintainers" in package files
3. Check documentation: "Maintained by", "Developed by" sections in README; GOVERNANCE.md, MAINTAINERS.md, CODEOWNERS
4. Check code attribution: copyright headers in source files, organizational email domains
5. Determine ownership type:
   - Organizational (preferred): foundation, company, government, university, NGO
   - Individual (acceptable if clear): named individuals with contact info
6. Verify consistency: does the copyright holder in LICENSE match the org in README and package.json?

PASS if: Clear copyright holder identified, consistent ownership claims, contact information available.
FAIL if: No copyright information, conflicting claims, anonymous/pseudonymous only, no way to contact owners.`
	},
	{
		indicator: 4,
		name: 'Platform Independence',
		prompt: `Verify that this project is platform-independent and not locked into specific vendor products or services.

ANALYSIS APPROACH:
1. Analyze dependencies for vendor lock-in:
   - AWS SDK (@aws-sdk/*, boto3), Azure SDK (@azure/*), Google Cloud SDK (@google-cloud/*)
   - Proprietary database drivers, vendor-specific packages
2. Search code for vendor-specific patterns:
   - AWS: amazonaws.com, S3, Lambda, DynamoDB, CloudFormation
   - Azure: .azurewebsites.net, Cosmos DB, Azure Functions
   - GCP: googleapis.com, BigQuery, Firestore, Cloud Functions
3. Examine database layer: are ORMs used? Is raw SQL database-specific? NoSQL vendor lock-in?
4. Check configuration: hard-coded vendor endpoints, vendor-specific IaC (CloudFormation, ARM templates)
5. Look for abstraction layers: service interfaces, dependency injection, strategy pattern, configuration-driven provider selection
6. Check deployment: Docker/containers for portability, platform-agnostic scripts

PASS if: Core functionality doesn't require specific vendors, vendor services are abstracted, can switch providers with config changes.
FAIL if: Hard dependency on vendor-specific services, core features require proprietary platforms, cannot run without specific cloud provider.`
	},
	{
		indicator: 5,
		name: 'Documentation',
		prompt: `Verify that this project has sufficient documentation to allow technical users to launch, configure, and run the solution.

ANALYSIS APPROACH:
1. Find documentation: README, docs/ directory, INSTALL.md, CONFIGURATION.md, DEPLOYMENT.md, API.md
2. Evaluate installation docs: prerequisites listed? Step-by-step instructions? Multiple OS support? Troubleshooting?
3. Evaluate configuration docs: example configs (.example, .sample)? All options documented? Required vs optional clear?
4. Evaluate deployment docs: deployment methods explained? Infrastructure requirements? CI/CD setup?
5. Evaluate API/usage docs: endpoints described? Request/response examples? Authentication details?

CRITICAL — verify documentation accuracy:
- For each major feature described in docs, verify the implementation exists in code
- Check that documented API endpoints actually exist in route handlers
- Verify documented config options are actually read by the application
- Documentation-implementation gaps count AGAINST the project
- Accurate docs of limited features > extensive docs of non-existent features

PASS if: Clear installation instructions, configuration documented, deployment explained, someone unfamiliar could deploy it.
FAIL if: Missing installation instructions, no configuration docs, deployment unclear, assumes too much prior knowledge, or docs describe features that don't exist in code.`
	},
	{
		indicator: 6,
		name: 'Data Extraction',
		prompt: `Verify that this project provides mechanisms for extracting non-PII data in non-proprietary formats. This criterion only applies to projects that collect or store user data.

ANALYSIS APPROACH:
1. FIRST: determine if the project handles user data — look for user models, database schemas, data collection forms, analytics. If NO user data is collected, this is an automatic PASS (N/A).
2. If yes, find export functionality:
   - API routes with "export", "download", "backup"
   - Functions named export*, download*, generate*Report
   - Admin/user interfaces with export buttons
3. Verify non-proprietary format support: CSV, JSON, XML, plain text, GeoJSON, SQL dumps
4. Check privacy handling: PII removal/anonymization functions, field selection/exclusion, role-based export access
5. Check bulk export: pagination, streaming, batch processing, scheduled exports

IMPORTANT: When you find documentation claiming data export capabilities, verify these claims by finding the actual implementation in code. Documentation alone is not sufficient.

PASS if: No user data collected (automatic), OR clear export functionality in non-proprietary formats with PII exclusion capability — verified in code.
FAIL if: Collects user data but no export mechanisms, only proprietary formats, no PII filtering, or export documented but not implemented.`
	},
	{
		indicator: 7,
		name: 'Privacy & Legal Compliance',
		prompt: `Verify that this project complies with privacy laws and best practices, protecting user data appropriately.

ANALYSIS APPROACH:
1. Determine if the project handles user data (authentication, forms, profiles, analytics, payments)
2. Check privacy documentation: PRIVACY.md, privacy policy pages, terms of service, compliance statements (GDPR, CCPA)
3. Verify data protection in code:
   - Encryption: password hashing (bcrypt, argon2), data encryption at rest, TLS/HTTPS enforcement
   - Authentication: secure auth mechanisms, RBAC, OAuth/JWT, session management
   - Input validation: sanitization, SQL injection prevention, XSS protection, CSRF tokens, rate limiting
4. Verify privacy rights implementation:
   - Data access: user data export, profile viewing
   - Data control: account deletion, opt-out, consent management
   - Data minimization: only necessary data collected, retention policies
5. Check security: HTTPS enforcement, security headers (CSP, HSTS), audit logging, dependency scanning

IMPORTANT: Verify privacy controls exist in code, not just in policy documents.

PASS if: Privacy policy exists, data protection measures implemented (encryption, access control), user rights respected, security measures protect data.
FAIL if: No privacy policy despite handling user data, weak protection (plain text passwords), no user data control, security vulnerabilities.`
	},
	{
		indicator: 8,
		name: 'Standards & Best Practices',
		prompt: `Verify that this project adheres to relevant open standards and software development best practices.

ANALYSIS APPROACH:
1. Code quality:
   - Linting configs (.eslintrc, .pylintrc, .prettierrc) — verify they're actually used, not just present
   - Type safety (tsconfig.json strict mode, Python type hints)
   - Consistent file/folder structure, separation of concerns
2. Testing:
   - Count test files — actually READ them to verify they're real tests, not empty stubs
   - Test framework configured AND tests actually run (check CI config or package.json scripts)
   - A test framework with 0 tests = fail for this sub-criterion
3. CI/CD:
   - GitHub Actions, GitLab CI, etc. — read the config to see if it runs tests or just builds
   - Automated test runs on PR/push
4. Security practices:
   - Lock files present (package-lock.json, etc.)
   - No hardcoded secrets (.env.example exists, .gitignore covers sensitive files)
   - Input validation, output encoding
5. Development workflow:
   - Comprehensive .gitignore, meaningful commit messages
   - PR templates, issue templates
   - Semantic versioning, tagged releases

PASS if: Linting enforced, real tests exist and run, CI configured, security practices followed, professional development workflow.
FAIL if: No linting, no tests (or empty stubs), no CI, hardcoded secrets, no .gitignore, unprofessional practices.`
	},
	{
		indicator: 9,
		name: 'Do No Harm',
		prompt: `Assess whether this project includes appropriate safeguards to prevent harm to its users and communities.

ANALYSIS APPROACH:
1. Determine the application type and associated risks:
   - Social platforms: content moderation, harassment prevention, misinformation
   - Data platforms: bias detection, fair representation, data ethics
   - Educational: age-appropriate content, inclusive design, accessibility
   - Healthcare: medical data sensitivity, liability disclaimers, emergency protocols
   - Financial: fraud prevention, fair lending, transparent terms
   - AI/ML: algorithmic fairness, bias testing, explainability
2. Check for harm prevention measures in code:
   - Content moderation: filtering, reporting, review workflows
   - User protection: blocking, muting, privacy controls, safety features
   - Technical security: rate limiting, abuse prevention, DDoS protection
   - Accessibility: ARIA attributes, keyboard navigation, screen reader support, WCAG compliance
3. Check for inclusive design:
   - Internationalization (i18n) support
   - RTL language support where applicable
   - Cultural sensitivity in content/design
   - Gender-inclusive language and options
4. Look for safety documentation: content policies, acceptable use, incident response

PASS if: Appropriate safeguards exist for the application type, user protection implemented, accessibility considered, inclusive design evident.
FAIL if: No harm prevention for high-risk application types, no content moderation where needed, no accessibility features, discriminatory design patterns.`
	}
];

/**
 * Build a single combined prompt that evaluates all 9 criteria in one Claude call.
 * This is more token-efficient than 9 separate calls.
 */
export function buildDPGEvaluationPrompt(): string {
	const criteriaInstructions = DPG_CRITERIA.map(
		(c) => `### Criterion ${c.indicator}: ${c.name}\n${c.prompt}`
	).join('\n\n');

	return `You are evaluating a software project against the Digital Public Goods (DPG) Standard. The DPG Standard has 9 indicators. You must evaluate each one based on ACTUAL CODE, not documentation claims.

CORE PRINCIPLE: "Code over claims" — documentation describing unimplemented features counts AGAINST the project, not for it. Every evaluation decision must reference specific files and evidence from the provided code.

${criteriaInstructions}

SCORING:
- Each criterion is BINARY: pass (1) or fail (0). No partial scores.
- 7 out of 9 passing = DPG qualified (HIGH likelihood)
- 4-6 passing = MEDIUM likelihood
- 0-3 passing = LOW likelihood
- Criterion 6 (Data Extraction) is N/A (automatic pass) if the project does not collect user data.

Return ONLY a JSON object (no markdown code fences) with this exact structure:
{
  "checklist": [
    {
      "indicator": 1,
      "criterion": "SDG Relevance",
      "status": "pass" or "fail",
      "evidence": "specific file:line references and code findings",
      "recommendation": "actionable fix if failing, or acknowledgment if passing"
    }
  ],
  "passing_count": <number 0-9>,
  "approval_likelihood": "low" or "medium" or "high",
  "priority_actions": [
    {
      "priority": "critical" or "high" or "medium",
      "action": "specific actionable step",
      "criterion": <indicator number>
    }
  ]
}

Include exactly 9 checklist items (one per criterion). Priority actions should list the 3-5 most impactful improvements, ordered by priority.`;
}
