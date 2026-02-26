<script lang="ts">
	let { data } = $props();
	let search = $state('');

	const toolMap = $derived.by(() => {
		const map: Record<string, any[]> = {};
		for (const p of data.projects) {
			const key = p.replaces_tool || 'Internal Process';
			if (!map[key]) map[key] = [];
			map[key].push(p);
		}
		return map;
	});

	const aiTools = $derived([...new Set(data.projects.flatMap((p: any) => p.ai_tools_used ?? []))]);
	const techStack = $derived([...new Set(data.projects.flatMap((p: any) => p.tech_stack ?? []))]);

	let filtered = $derived.by(() => {
		if (!search) return data.projects;
		const q = search.toLowerCase();
		return data.projects.filter((p: any) =>
			p.title?.toLowerCase().includes(q) ||
			p.replaces_tool?.toLowerCase().includes(q) ||
			(p.tech_stack ?? []).some((t: string) => t.toLowerCase().includes(q)) ||
			(p.ai_tools_used ?? []).some((t: string) => t.toLowerCase().includes(q))
		);
	});
</script>

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-display font-bold text-text tracking-tighter">Catalog</h1>
		<p class="text-sm text-text-muted mt-1">Every Sinai project, searchable</p>
	</div>

	<input
		type="text"
		placeholder="Search by name, tool, tech..."
		bind:value={search}
		class="glass-input px-4 py-2 text-sm text-text w-72"
	/>

	{#if aiTools.length > 0 || techStack.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
			{#if aiTools.length > 0}
				<div class="glass-card p-6">
					<h3 class="text-sm font-display font-semibold text-text mb-3">AI Tools</h3>
					<div class="flex flex-wrap gap-2">
						{#each aiTools as tool}
							{@const count = data.projects.filter((p: any) => (p.ai_tools_used ?? []).includes(tool)).length}
							<span class="tag-primary">{tool} ({count})</span>
						{/each}
					</div>
				</div>
			{/if}
			{#if techStack.length > 0}
				<div class="glass-card p-6">
					<h3 class="text-sm font-display font-semibold text-text mb-3">Tech Stack</h3>
					<div class="flex flex-wrap gap-2">
						{#each techStack as tech}
							{@const count = data.projects.filter((p: any) => (p.tech_stack ?? []).includes(tech)).length}
							<span class="tag-neutral">{tech} ({count})</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if Object.keys(toolMap).length > 0}
		<div class="glass-card p-6">
			<h3 class="text-sm font-display font-semibold text-text mb-4">Tool Replacements</h3>
			<div class="space-y-2">
				{#each Object.entries(toolMap) as [tool, projects]}
					<div class="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.04] px-4 py-3">
						<span class="text-sm text-danger line-through w-36 flex-shrink-0">{tool}</span>
						<span class="text-text-muted">&rarr;</span>
						<div class="flex flex-wrap gap-1.5">
							{#each projects as project}
								<a href="/projects/{project.id}" class="tag-success hover:bg-success/20 transition-colors">
									{project.title}
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if filtered.length > 0}
		<div class="glass-card overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-white/[0.06] text-xs font-display font-medium text-text-muted uppercase tracking-wider">
						<th class="px-6 py-4 text-left">Project</th>
						<th class="px-6 py-4 text-left">Replaces</th>
						<th class="px-6 py-4 text-left">AI Tools</th>
						<th class="px-6 py-4 text-right">Saved</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">
					{#each filtered as project}
						<tr class="table-row-hover">
							<td class="px-6 py-4"><a href="/projects/{project.id}" class="text-sm font-medium text-text hover:text-primary-light transition-colors">{project.title}</a></td>
							<td class="px-6 py-4 text-sm text-text-muted">{project.replaces_tool || '—'}</td>
							<td class="px-6 py-4">
								<div class="flex gap-1.5">
									{#each (project.ai_tools_used ?? []).slice(0, 3) as tool}
										<span class="tag-primary">{tool}</span>
									{/each}
								</div>
							</td>
							<td class="px-6 py-4 text-sm font-medium font-mono text-success text-right">${((project.annual_cost_replaced ?? 0) / 1000).toFixed(0)}k</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="glass-card p-16 text-center">
			<p class="text-sm text-text-muted">No projects found</p>
		</div>
	{/if}
</div>
