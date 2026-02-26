<script lang="ts">
	import ProjectCard from '$lib/components/ui/ProjectCard.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	let search = $state(page.url.searchParams.get('q') || '');
	let filterStatus = $state(page.url.searchParams.get('status') || 'all');
	let sortBy = $state(page.url.searchParams.get('sort') || 'newest');

	function applyFilters() {
		const params = new URLSearchParams();
		if (search) params.set('q', search);
		if (filterStatus !== 'all') params.set('status', filterStatus);
		if (sortBy !== 'newest') params.set('sort', sortBy);
		goto(`/projects?${params.toString()}`, { replaceState: true });
	}

	const statuses = ['all', 'featured', 'submitted', 'draft'] as const;
</script>

<div class="space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-display font-bold text-text tracking-tighter">Projects</h1>
			<p class="text-sm text-text-muted mt-1">{data.projects.length} projects</p>
		</div>
		<a href="/submit" class="btn-primary px-4 py-2 text-sm">
			New Project
		</a>
	</div>

	<div class="glass-card p-4 flex flex-wrap items-center gap-3">
		<input
			type="text"
			placeholder="Search..."
			bind:value={search}
			onkeydown={(e) => { if (e.key === 'Enter') applyFilters(); }}
			class="glass-input px-4 py-2 text-sm text-text w-64"
		/>
		<div class="flex rounded-lg overflow-hidden border border-white/[0.06]">
			{#each statuses as status}
				<button
					onclick={() => { filterStatus = status; applyFilters(); }}
					class="px-3 py-2 text-xs font-medium transition-all duration-200
						{filterStatus === status
						? 'bg-primary/20 text-primary-light'
						: 'text-text-muted hover:text-text hover:bg-white/[0.04]'}"
				>
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</button>
			{/each}
		</div>
		<select
			bind:value={sortBy}
			onchange={applyFilters}
			class="glass-input px-3 py-2 text-sm text-text"
		>
			<option value="newest">Newest</option>
			<option value="cost">Most Saved</option>
			<option value="hours">Most Hours</option>
			<option value="adoption">Most Adopted</option>
		</select>
	</div>

	{#if data.projects.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each data.projects as project}
				<ProjectCard {project} />
			{/each}
		</div>
	{:else}
		<div class="glass-card p-16 text-center">
			<p class="text-text-muted text-sm">No projects found.</p>
			<a href="/submit" class="mt-2 inline-block text-sm text-primary-light hover:underline">Submit one</a>
		</div>
	{/if}
</div>
