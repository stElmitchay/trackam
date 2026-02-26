<script lang="ts">
	let { data } = $props();
	let view = $state<'builders' | 'projects'>('builders');
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-display font-bold text-text tracking-tighter">Leaderboard</h1>
		<div class="flex rounded-lg overflow-hidden border border-white/[0.06]">
			<button
				onclick={() => view = 'builders'}
				class="px-4 py-2 text-xs font-medium transition-all duration-200 {view === 'builders' ? 'bg-primary/20 text-primary-light' : 'text-text-muted hover:text-text hover:bg-white/[0.04]'}"
			>Builders</button>
			<button
				onclick={() => view = 'projects'}
				class="px-4 py-2 text-xs font-medium transition-all duration-200 {view === 'projects' ? 'bg-primary/20 text-primary-light' : 'text-text-muted hover:text-text hover:bg-white/[0.04]'}"
			>Projects</button>
		</div>
	</div>

	{#if view === 'builders'}
		{#if data.builders.length >= 3}
			<div class="grid grid-cols-3 gap-5">
				{#each [1, 0, 2] as idx, i}
					{@const builder = data.builders[idx]}
					{@const medals = ['🥈', '🥇', '🥉']}
					{#if builder}
						<div class="glass-card p-6 text-center {i === 1 ? 'ring-1 ring-accent/30 shadow-[0_0_40px_rgba(245,158,11,0.1)] -mt-4 p-8' : ''}">
							<div class="text-3xl mb-3">{medals[i]}</div>
							{#if builder.avatar_url}
								<img src={builder.avatar_url} alt={builder.full_name} class="h-14 w-14 mx-auto rounded-full object-cover ring-2 ring-primary/20" />
							{:else}
								<div class="h-14 w-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary-light ring-2 ring-primary/20">
									{builder.full_name?.charAt(0) ?? '?'}
								</div>
							{/if}
							<h3 class="mt-3 text-base font-display font-semibold text-text">{builder.full_name}</h3>
							<p class="text-xs text-text-muted">{builder.department || '—'}</p>
							<div class="mt-4 grid grid-cols-3 gap-2 text-center">
								<div>
									<p class="text-base font-bold font-mono text-text">{builder.total_xp ?? 0}</p>
									<p class="text-xs text-text-muted">XP</p>
								</div>
								<div>
									<p class="text-base font-bold font-mono text-text">{builder.project_count ?? 0}</p>
									<p class="text-xs text-text-muted">Projects</p>
								</div>
								<div>
									<p class="text-base font-bold font-mono text-success">${((builder.total_saved ?? 0) / 1000).toFixed(0)}k</p>
									<p class="text-xs text-text-muted">Saved</p>
								</div>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<div class="glass-card overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-white/[0.06] text-xs font-display font-medium text-text-muted uppercase tracking-wider">
						<th class="px-6 py-4 text-left w-12">#</th>
						<th class="px-6 py-4 text-left">Builder</th>
						<th class="px-6 py-4 text-left">Level</th>
						<th class="px-6 py-4 text-right">XP</th>
						<th class="px-6 py-4 text-right">Projects</th>
						<th class="px-6 py-4 text-right">Saved</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">
					{#each data.builders as builder}
						<tr class="table-row-hover">
							<td class="px-6 py-4 text-sm text-text-muted font-mono">{builder.rank}</td>
							<td class="px-6 py-4">
								<a href="/profiles/{builder.id}" class="flex items-center gap-2.5 hover:text-primary-light transition-colors">
									{#if builder.avatar_url}
										<img src={builder.avatar_url} alt={builder.full_name} class="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" />
									{:else}
										<div class="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary-light ring-1 ring-white/10">
											{builder.full_name?.charAt(0) ?? '?'}
										</div>
									{/if}
									<div>
										<p class="text-sm font-medium text-text">{builder.full_name}</p>
										<p class="text-xs text-text-muted">{builder.department || '—'}</p>
									</div>
								</a>
							</td>
							<td class="px-6 py-4"><span class="tag-primary">Lv{builder.level}</span></td>
							<td class="px-6 py-4 text-sm text-text text-right font-mono tabular-nums">{(builder.total_xp ?? 0).toLocaleString()}</td>
							<td class="px-6 py-4 text-sm text-text text-right font-mono">{builder.project_count ?? 0}</td>
							<td class="px-6 py-4 text-sm font-medium text-success text-right font-mono">${((builder.total_saved ?? 0) / 1000).toFixed(0)}k</td>
						</tr>
					{/each}
					{#if data.builders.length === 0}
						<tr><td colspan="6" class="px-6 py-12 text-center text-sm text-text-muted">No builders yet</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="glass-card overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="border-b border-white/[0.06] text-xs font-display font-medium text-text-muted uppercase tracking-wider">
						<th class="px-6 py-4 text-left w-12">#</th>
						<th class="px-6 py-4 text-left">Project</th>
						<th class="px-6 py-4 text-left">Replaces</th>
						<th class="px-6 py-4 text-right">Saved</th>
						<th class="px-6 py-4 text-right">Hours/wk</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-white/[0.04]">
					{#each data.projects as project, i}
						<tr class="table-row-hover">
							<td class="px-6 py-4 text-sm text-text-muted font-mono">{i + 1}</td>
							<td class="px-6 py-4">
								<a href="/projects/{project.id}" class="text-sm font-medium text-text hover:text-primary-light transition-colors">{project.title}</a>
							</td>
							<td class="px-6 py-4 text-sm text-text-secondary">{project.replaces_tool || '—'}</td>
							<td class="px-6 py-4 text-sm font-medium text-success text-right font-mono">${((project.annual_cost_replaced ?? 0) / 1000).toFixed(0)}k</td>
							<td class="px-6 py-4 text-sm text-text text-right font-mono">{project.estimated_hours_saved_weekly ?? 0}h</td>
						</tr>
					{/each}
					{#if data.projects.length === 0}
						<tr><td colspan="5" class="px-6 py-12 text-center text-sm text-text-muted">No projects yet</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
