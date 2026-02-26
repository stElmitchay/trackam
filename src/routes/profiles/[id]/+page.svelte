<script lang="ts">
	import ProjectCard from '$lib/components/ui/ProjectCard.svelte';
	import AchievementBadge from '$lib/components/ui/AchievementBadge.svelte';

	let { data } = $props();
	const profile = $derived(data.profile);
	const projects = $derived(data.projects);
	const earnedAchievements = $derived(data.earnedAchievements);
	const allAchievements = $derived(data.allAchievements);
	const claimedRequests = $derived(data.claimedRequests);

	function daysAgo(dateStr: string): number {
		return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
	}

	const totalCostSaved = $derived(projects.reduce((s: number, p: any) => s + (p.annual_cost_replaced ?? 0), 0));
	const totalHoursSaved = $derived(projects.reduce((s: number, p: any) => s + (p.estimated_hours_saved_weekly ?? 0), 0));
	const earnedIds = $derived(new Set(earnedAchievements.map((ea: any) => ea.achievement_id)));
</script>

<div class="max-w-3xl mx-auto space-y-8">
	<a href="/profiles" class="inline-flex items-center gap-1.5 glass-card px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-white/[0.06] transition-all duration-200">&larr; Builders</a>

	<div class="glass-card p-8">
		<div class="flex items-center gap-5">
			{#if profile.avatar_url}
				<img src={profile.avatar_url} alt={profile.full_name} class="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]" />
			{:else}
				<div class="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary-light ring-2 ring-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
					{profile.full_name?.charAt(0) ?? '?'}
				</div>
			{/if}
			<div>
				<h1 class="text-2xl font-display font-bold text-text">{profile.full_name}</h1>
				<p class="text-sm text-text-muted">{profile.title || '—'} · {profile.department || '—'}</p>
				<div class="mt-2 flex items-center gap-3">
					<span class="tag-primary">Level {profile.level ?? 1}</span>
					<span class="text-sm font-mono text-text-secondary">{(profile.total_xp ?? 0).toLocaleString()} XP</span>
					{#if profile.streak}
						<span class="text-sm text-accent-light">🔥 {profile.streak}</span>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-4 gap-5">
		<div class="glass-card p-5 text-center">
			<p class="text-xl font-bold font-mono text-text">{projects.length}</p>
			<p class="text-xs text-text-muted">Projects</p>
		</div>
		<div class="glass-card p-5 text-center">
			<p class="text-xl font-bold font-mono text-success">${(totalCostSaved / 1000).toFixed(0)}k</p>
			<p class="text-xs text-text-muted">Saved/yr</p>
		</div>
		<div class="glass-card p-5 text-center">
			<p class="text-xl font-bold font-mono text-primary-light">{totalHoursSaved}h</p>
			<p class="text-xs text-text-muted">Saved/wk</p>
		</div>
		<div class="glass-card p-5 text-center">
			<p class="text-xl font-bold font-mono text-text">{earnedAchievements.length}</p>
			<p class="text-xs text-text-muted">Badges</p>
		</div>
	</div>

	{#if claimedRequests.length > 0}
		<div>
			<h3 class="text-sm font-display font-semibold text-text mb-4">In Progress</h3>
			<div class="space-y-3">
				{#each claimedRequests as req}
					<div class="glass-card p-5">
						<div class="flex items-center gap-2">
							<span class="tag-accent">In Progress</span>
							<h4 class="text-sm font-display font-semibold text-text">{req.title}</h4>
							{#if req.bonus_xp > 0}
								<span class="tag-primary font-mono">+{req.bonus_xp} XP bounty</span>
							{/if}
						</div>
						<p class="mt-1 text-sm text-text-secondary">{req.description}</p>
						<p class="mt-2 text-xs text-text-muted">
							Claimed {req.claimed_at ? daysAgo(req.claimed_at) : '?'}d ago
							{#if req.claimed_at && daysAgo(req.claimed_at) > 14}
								<span class="text-danger ml-2">Overdue</span>
							{/if}
						</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if allAchievements.length > 0}
		<div class="glass-card p-6">
			<h3 class="text-sm font-display font-semibold text-text mb-4">Achievements</h3>
			<div class="flex flex-wrap gap-4">
				{#each allAchievements as achievement}
					<AchievementBadge
						icon={achievement.icon}
						name={achievement.name}
						description={achievement.description}
						earned={earnedIds.has(achievement.id)}
					/>
				{/each}
			</div>
		</div>
	{/if}

	{#if projects.length > 0}
		<div>
			<h3 class="text-sm font-display font-semibold text-text mb-4">Projects</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
				{#each projects as project}
					<ProjectCard {project} />
				{/each}
			</div>
		</div>
	{:else}
		<div class="glass-card p-12 text-center">
			<p class="text-sm text-text-muted">No projects yet</p>
		</div>
	{/if}
</div>
