<script lang="ts">
	let { data } = $props();
	const project = $derived(data.project);
	const teamMembers = $derived(data.teamMembers);
</script>

<div class="max-w-3xl mx-auto space-y-8">
	<a href="/projects" class="inline-flex items-center gap-1.5 glass-card px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-white/[0.06] transition-all duration-200">&larr; Projects</a>

	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-display font-bold text-text tracking-tighter">{project.title}</h1>
			<p class="mt-2 text-sm text-text-secondary leading-relaxed">{project.description}</p>
		</div>
		{#if project.status === 'featured'}
			<span class="tag-accent flex-shrink-0">Featured</span>
		{/if}
	</div>

	<div class="grid grid-cols-3 gap-5">
		<div class="glass-card p-6 text-center">
			<p class="text-2xl font-bold font-mono text-success">${((project.annual_cost_replaced ?? 0) / 1000).toFixed(0)}k</p>
			<p class="text-xs text-text-muted mt-1">Saved / year</p>
		</div>
		<div class="glass-card p-6 text-center">
			<p class="text-2xl font-bold font-mono text-primary-light">{project.estimated_hours_saved_weekly ?? 0}h</p>
			<p class="text-xs text-text-muted mt-1">Saved / week</p>
		</div>
		<div class="glass-card p-6 text-center">
			<p class="text-2xl font-bold font-mono text-text">{project.adoption_count ?? 0}</p>
			<p class="text-xs text-text-muted mt-1">Adoptions</p>
		</div>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
		<div class="glass-card p-6 space-y-5">
			<div>
				<h3 class="text-xs font-display font-medium text-text-muted uppercase tracking-wider">Problem</h3>
				<p class="mt-1.5 text-sm text-text leading-relaxed">{project.problem_statement}</p>
			</div>
			<div>
				<h3 class="text-xs font-display font-medium text-text-muted uppercase tracking-wider">Solution</h3>
				<p class="mt-1.5 text-sm text-text leading-relaxed">{project.solution_summary}</p>
			</div>
		</div>

		<div class="glass-card p-6 space-y-5">
			{#if project.replaces_tool}
				<div>
					<h3 class="text-xs font-display font-medium text-text-muted uppercase tracking-wider">Replaces</h3>
					<p class="mt-1.5 text-sm text-text">{project.replaces_tool}</p>
				</div>
			{/if}
			<div>
				<h3 class="text-xs font-display font-medium text-text-muted uppercase tracking-wider">Tech Stack</h3>
				<div class="mt-1.5 flex flex-wrap gap-1.5">
					{#each project.tech_stack ?? [] as tech}
						<span class="tag-neutral">{tech}</span>
					{/each}
					{#if (project.tech_stack ?? []).length === 0}
						<span class="text-xs text-text-muted">None specified</span>
					{/if}
				</div>
			</div>
			<div>
				<h3 class="text-xs font-display font-medium text-text-muted uppercase tracking-wider">AI Tools</h3>
				<div class="mt-1.5 flex flex-wrap gap-1.5">
					{#each project.ai_tools_used ?? [] as tool}
						<span class="tag-primary">{tool}</span>
					{/each}
					{#if (project.ai_tools_used ?? []).length === 0}
						<span class="text-xs text-text-muted">None specified</span>
					{/if}
				</div>
			</div>
			<div>
				<h3 class="text-xs font-display font-medium text-text-muted uppercase tracking-wider">Period</h3>
				<p class="mt-1.5 text-sm text-text font-mono">Season {project.season ?? '—'} · Week {project.week ?? '—'}</p>
			</div>
		</div>
	</div>

	{#if project.demo_url || project.repo_url}
		<div class="flex gap-3">
			{#if project.demo_url}
				<a href={project.demo_url} target="_blank" rel="noopener" class="btn-primary px-5 py-2.5 text-sm">
					View Demo
				</a>
			{/if}
			{#if project.repo_url}
				<a href={project.repo_url} target="_blank" rel="noopener" class="btn-secondary px-5 py-2.5 text-sm">
					Source Code
				</a>
			{/if}
		</div>
	{/if}

	{#if teamMembers.length > 0}
		<div class="glass-card p-6">
			<h3 class="text-sm font-display font-semibold text-text mb-4">Team</h3>
			<div class="flex flex-wrap gap-3">
				{#each teamMembers as member}
					<a href="/profiles/{member.id}" class="flex items-center gap-2.5 glass-card px-4 py-3 hover:bg-white/[0.06] transition-all duration-200">
						{#if member.avatar_url}
							<img src={member.avatar_url} alt={member.full_name} class="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" />
						{:else}
							<div class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary-light ring-1 ring-white/10">
								{member.full_name?.charAt(0) ?? '?'}
							</div>
						{/if}
						<div>
							<p class="text-sm font-medium text-text">{member.full_name}</p>
							<p class="text-xs text-text-muted">{member.department || 'No department'}</p>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>
