<script lang="ts">
	let { data } = $props();

	const weeklyData = $derived.by(() => {
		const weeks: Record<number, { week: number; submissions: number; costSaved: number; hoursSaved: number }> = {};
		for (const p of data.projects) {
			const w = p.week ?? 0;
			if (!weeks[w]) weeks[w] = { week: w, submissions: 0, costSaved: 0, hoursSaved: 0 };
			weeks[w].submissions++;
			weeks[w].costSaved += p.annual_cost_replaced ?? 0;
			weeks[w].hoursSaved += p.estimated_hours_saved_weekly ?? 0;
		}
		return Object.values(weeks).sort((a, b) => a.week - b.week);
	});

	const cumulativeData = $derived.by(() => {
		let cumulative = 0;
		return weeklyData.map(w => {
			cumulative += w.costSaved;
			return { week: w.week, total: cumulative };
		});
	});

	const maxCumulative = $derived(Math.max(1, ...cumulativeData.map(d => d.total)));
	const maxSubmissions = $derived(Math.max(1, ...weeklyData.map(d => d.submissions)));

	const aiToolCounts = $derived.by(() => {
		const counts: Record<string, number> = {};
		for (const p of data.projects) {
			for (const tool of p.ai_tools_used ?? []) {
				counts[tool] = (counts[tool] || 0) + 1;
			}
		}
		return Object.entries(counts).sort((a, b) => b[1] - a[1]);
	});
	const maxToolCount = $derived(Math.max(1, ...aiToolCounts.map(([, c]) => c)));

	const sortedDepts = $derived(data.departmentStats.slice().sort((a: any, b: any) => (b.total_cost_saved ?? 0) - (a.total_cost_saved ?? 0)));
	const maxDeptCost = $derived(Math.max(1, ...sortedDepts.map((d: any) => d.total_cost_saved ?? 0)));
</script>

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-display font-bold text-text tracking-tighter">Analytics</h1>
		<p class="text-sm text-text-muted mt-1">Sinai program performance and insights</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-5">
		<div class="glass-card p-5">
			<p class="text-xs font-medium text-text-muted uppercase tracking-widest">Total Cost Saved</p>
			<p class="text-2xl font-bold font-mono text-success mt-2">${((data.totals.total_cost_saved ?? 0) / 1000).toFixed(0)}k</p>
		</div>
		<div class="glass-card p-5">
			<p class="text-xs font-medium text-text-muted uppercase tracking-widest">Hours Saved/Week</p>
			<p class="text-2xl font-bold font-mono text-primary-light mt-2">{data.totals.total_hours_saved ?? 0}</p>
		</div>
		<div class="glass-card p-5">
			<p class="text-xs font-medium text-text-muted uppercase tracking-widest">Active Builders</p>
			<p class="text-2xl font-bold font-mono text-text mt-2">{data.profiles.length}</p>
		</div>
		<div class="glass-card p-5">
			<p class="text-xs font-medium text-text-muted uppercase tracking-widest">Total Projects</p>
			<p class="text-2xl font-bold font-mono text-accent-light mt-2">{data.totals.total_projects ?? 0}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="glass-card p-6">
			<h3 class="text-sm font-display font-semibold text-text mb-5">Cumulative Cost Saved</h3>
			{#if cumulativeData.length > 0}
				<div class="space-y-3">
					{#each cumulativeData as d}
						<div class="flex items-center gap-3">
							<span class="text-xs font-mono text-text-muted w-10 flex-shrink-0">Wk {d.week}</span>
							<div class="flex-1 h-7 rounded-md bg-white/[0.03] overflow-hidden">
								<div
									class="h-full rounded-md bg-gradient-to-r from-success/30 via-success/60 to-success flex items-center justify-end px-2 transition-all duration-500 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
									style="width: {Math.max(8, (d.total / maxCumulative) * 100)}%"
								>
									<span class="text-[10px] font-bold font-mono text-white">${(d.total / 1000).toFixed(0)}k</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text-muted py-8 text-center">No data yet</p>
			{/if}
		</div>

		<div class="glass-card p-6">
			<h3 class="text-sm font-display font-semibold text-text mb-5">Weekly Submissions</h3>
			{#if weeklyData.length > 0}
				<div class="flex items-end gap-3 h-40">
					{#each weeklyData as d}
						<div class="flex-1 flex flex-col items-center gap-1.5">
							<span class="text-xs font-bold font-mono text-text">{d.submissions}</span>
							<div class="w-full flex justify-center">
								<div
									class="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-primary/40 via-primary to-primary-light transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.2)]"
									style="height: {Math.max(4, (d.submissions / maxSubmissions) * 120)}px"
								></div>
							</div>
							<span class="text-xs font-mono text-text-muted">W{d.week}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text-muted py-8 text-center">No data yet</p>
			{/if}
		</div>

		<div class="glass-card p-6">
			<h3 class="text-sm font-display font-semibold text-text mb-5">AI Tool Usage</h3>
			{#if aiToolCounts.length > 0}
				<div class="space-y-3">
					{#each aiToolCounts as [tool, count]}
						<div class="flex items-center gap-3">
							<span class="text-xs text-text w-28 truncate flex-shrink-0">{tool}</span>
							<div class="flex-1 h-6 rounded-md bg-white/[0.03] overflow-hidden">
								<div
									class="h-full rounded-md bg-gradient-to-r from-primary/30 to-primary/60 flex items-center px-2 transition-all duration-300"
									style="width: {Math.max(10, (count / maxToolCount) * 100)}%"
								>
									<span class="text-[10px] font-bold font-mono text-white">{count}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text-muted py-8 text-center">No data yet</p>
			{/if}
		</div>

		<div class="glass-card p-6">
			<h3 class="text-sm font-display font-semibold text-text mb-5">Department Breakdown</h3>
			{#if sortedDepts.length > 0}
				<div class="space-y-3">
					{#each sortedDepts as dept}
						<div>
							<div class="flex justify-between mb-1">
								<span class="text-xs text-text">{dept.department}</span>
								<span class="text-xs font-mono text-success font-medium">${((dept.total_cost_saved ?? 0) / 1000).toFixed(0)}k</span>
							</div>
							<div class="h-3.5 rounded-md bg-white/[0.03] overflow-hidden">
								<div
									class="h-full rounded-md bg-gradient-to-r from-accent/20 via-accent/50 to-accent transition-all duration-300"
									style="width: {Math.max(5, ((dept.total_cost_saved ?? 0) / maxDeptCost) * 100)}%"
								></div>
							</div>
							<div class="flex justify-between text-xs text-text-muted mt-0.5">
								<span class="font-mono">{dept.total_projects} projects · {dept.active_builders} builders</span>
								<span class="font-mono">{dept.total_hours_saved}h/wk</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-text-muted py-8 text-center">No data yet</p>
			{/if}
		</div>
	</div>
</div>
