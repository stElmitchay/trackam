<script lang="ts">
	let { data } = $props();

	let search = $state('');
	let filterDept = $state('all');

	const departments = $derived([...new Set(data.profiles.map((p: any) => p.department).filter(Boolean))]);

	let filtered = $derived.by(() => {
		let result = data.profiles;
		if (search) {
			const q = search.toLowerCase();
			result = result.filter((p: any) => p.full_name?.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q));
		}
		if (filterDept !== 'all') {
			result = result.filter((p: any) => p.department === filterDept);
		}
		return result;
	});
</script>

<div class="space-y-8">
	<div>
		<h1 class="text-3xl font-display font-bold text-text tracking-tighter">Builders</h1>
		<p class="text-sm text-text-muted mt-1">{data.profiles.length} people</p>
	</div>

	<div class="flex items-center gap-3">
		<input
			type="text"
			placeholder="Search..."
			bind:value={search}
			class="glass-input px-4 py-2 text-sm text-text w-64"
		/>
		{#if departments.length > 0}
			<select
				bind:value={filterDept}
				class="glass-input px-3 py-2 text-sm text-text"
			>
				<option value="all">All Departments</option>
				{#each departments as dept}
					<option value={dept}>{dept}</option>
				{/each}
			</select>
		{/if}
	</div>

	{#if filtered.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each filtered as profile}
				<a
					href="/profiles/{profile.id}"
					class="group glass-card-hover p-6 block"
				>
					<div class="flex items-center gap-3">
						{#if profile.avatar_url}
							<img src={profile.avatar_url} alt={profile.full_name} class="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" />
						{:else}
							<div class="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary-light ring-2 ring-primary/20">
								{profile.full_name?.charAt(0) ?? '?'}
							</div>
						{/if}
						<div>
							<h3 class="text-sm font-display font-semibold text-text group-hover:text-primary-light transition-colors">{profile.full_name}</h3>
							<p class="text-xs text-text-muted">{profile.title || '—'} · {profile.department || '—'}</p>
						</div>
					</div>

					<div class="mt-5 grid grid-cols-4 gap-2 text-center">
						<div>
							<p class="text-sm font-bold font-mono text-text">{profile.level ?? 1}</p>
							<p class="text-xs text-text-muted">Level</p>
						</div>
						<div>
							<p class="text-sm font-bold font-mono text-text">{(profile.total_xp ?? 0).toLocaleString()}</p>
							<p class="text-xs text-text-muted">XP</p>
						</div>
						<div>
							<p class="text-sm font-bold font-mono text-text">{profile.project_count ?? 0}</p>
							<p class="text-xs text-text-muted">Projects</p>
						</div>
						<div>
							<p class="text-sm font-bold font-mono text-accent-light">{profile.streak ?? 0}</p>
							<p class="text-xs text-text-muted">Streak</p>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="glass-card p-16 text-center">
			<p class="text-sm text-text-muted">No builders found</p>
		</div>
	{/if}
</div>
