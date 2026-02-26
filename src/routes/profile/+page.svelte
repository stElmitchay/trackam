<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const profile = $derived(data.profile);

	let editing = $state(false);
	let saved = $state(false);
	let avatarPreview = $state<string | null>(null);

	function handleAvatarChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				avatarPreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	// After a successful save, close edit mode
	$effect(() => {
		if (form?.success) {
			editing = false;
			saved = true;
			avatarPreview = null;
			setTimeout(() => saved = false, 3000);
		}
	});
</script>

<div class="max-w-2xl mx-auto space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-display font-bold text-text tracking-tighter">Your Profile</h1>
			<p class="text-sm text-text-muted mt-1">Manage your Sinai builder profile</p>
		</div>
		{#if !editing}
			<button onclick={() => editing = true} class="btn-secondary px-4 py-2 text-sm">
				Edit Profile
			</button>
		{/if}
	</div>

	{#if form?.error}
		<div class="glass-card p-3 text-sm text-danger" style="border-color: rgba(239, 68, 68, 0.3);">{form.error}</div>
	{/if}
	{#if saved}
		<div class="glass-card p-3 text-sm text-success" style="border-color: rgba(34, 197, 94, 0.3);">Profile updated!</div>
	{/if}

	{#if editing}
		<!-- Edit Mode -->
		<form
			method="POST"
			action="?/update"
			enctype="multipart/form-data"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
				};
			}}
			class="glass-card p-8 space-y-6"
		>
			<!-- Avatar Upload -->
			<div class="flex items-center gap-6">
				<div class="relative group">
					{#if avatarPreview}
						<img src={avatarPreview} alt="Avatar preview" class="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
					{:else if profile?.avatar_url}
						<img src={profile.avatar_url} alt={profile.full_name} class="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20" />
					{:else}
						<div class="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary-light ring-2 ring-primary/20">
							{profile?.full_name?.charAt(0) || '?'}
						</div>
					{/if}
					<label class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
						<svg class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
						<input
							type="file"
							name="avatar"
							accept="image/jpeg,image/png,image/webp,image/gif"
							class="hidden"
							onchange={handleAvatarChange}
						/>
					</label>
				</div>
				<div>
					<p class="text-sm font-medium text-text">Profile Photo</p>
					<p class="text-xs text-text-muted mt-0.5">JPEG, PNG, WebP, or GIF. Max 2MB.</p>
				</div>
			</div>

			<div>
				<label for="full_name" class="block text-sm font-medium text-text mb-1">Full Name</label>
				<input
					id="full_name"
					name="full_name"
					type="text"
					value={profile?.full_name ?? ''}
					required
					class="glass-input w-full px-4 py-2.5 text-sm text-text"
				/>
			</div>
			<div>
				<label for="department" class="block text-sm font-medium text-text mb-1">Department</label>
				<input
					id="department"
					name="department"
					type="text"
					value={profile?.department ?? ''}
					placeholder="e.g., Engineering, Product, Design"
					class="glass-input w-full px-4 py-2.5 text-sm text-text"
				/>
			</div>
			<div>
				<label for="title" class="block text-sm font-medium text-text mb-1">Job Title</label>
				<input
					id="title"
					name="title"
					type="text"
					value={profile?.title ?? ''}
					placeholder="e.g., Senior Developer, Product Manager"
					class="glass-input w-full px-4 py-2.5 text-sm text-text"
				/>
			</div>

			<div class="flex items-center gap-3 pt-2">
				<button type="submit" class="btn-primary px-5 py-2.5 text-sm">
					Save Changes
				</button>
				<button type="button" onclick={() => { editing = false; avatarPreview = null; }} class="btn-secondary px-5 py-2.5 text-sm">
					Cancel
				</button>
			</div>
		</form>
	{:else}
		<!-- View Mode -->
		<div class="glass-card p-8">
			<div class="flex items-center gap-6">
				{#if profile?.avatar_url}
					<img src={profile.avatar_url} alt={profile.full_name} class="h-20 w-20 rounded-full object-cover ring-2 ring-primary/20 shadow-[0_0_25px_rgba(139,92,246,0.15)]" />
				{:else}
					<div class="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary-light ring-2 ring-primary/20 shadow-[0_0_25px_rgba(139,92,246,0.15)]">
						{profile?.full_name?.charAt(0) || '?'}
					</div>
				{/if}
				<div>
					<h2 class="text-2xl font-display font-bold text-text">{profile?.full_name || 'Unnamed'}</h2>
					<p class="text-sm text-text-muted">{profile?.email}</p>
					{#if profile?.title || profile?.department}
						<p class="text-sm text-text-secondary mt-0.5">
							{profile?.title || '—'}{#if profile?.title && profile?.department} · {/if}{profile?.department || ''}
						</p>
					{/if}
					<div class="mt-3 flex items-center gap-3">
						<span class="tag-primary">Level {profile?.level ?? 1}</span>
						<span class="text-sm font-mono text-text-secondary">{(profile?.total_xp ?? 0).toLocaleString()} XP</span>
						{#if profile?.streak}
							<span class="text-sm text-accent-light">🔥 {profile.streak} week streak</span>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-5">
			<div class="glass-card p-5 text-center">
				<p class="text-xs font-medium text-text-muted uppercase tracking-widest">Level</p>
				<p class="text-2xl font-bold font-mono text-text mt-1">{profile?.level ?? 1}</p>
			</div>
			<div class="glass-card p-5 text-center">
				<p class="text-xs font-medium text-text-muted uppercase tracking-widest">Total XP</p>
				<p class="text-2xl font-bold font-mono text-primary-light mt-1">{(profile?.total_xp ?? 0).toLocaleString()}</p>
			</div>
			<div class="glass-card p-5 text-center">
				<p class="text-xs font-medium text-text-muted uppercase tracking-widest">Streak</p>
				<p class="text-2xl font-bold font-mono text-accent-light mt-1">{profile?.streak ?? 0}</p>
			</div>
		</div>
	{/if}

	<!-- Account section (always visible) -->
	<div class="glass-card p-6">
		<h3 class="text-sm font-display font-semibold text-text mb-3">Account</h3>
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-text">{profile?.email}</p>
				<p class="text-xs text-text-muted">Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'recently'}</p>
			</div>
			<form method="POST" action="?/logout">
				<button
					type="submit"
					class="btn-secondary px-4 py-2 text-sm text-danger"
					style="border-color: rgba(239, 68, 68, 0.3);"
				>
					Sign Out
				</button>
			</form>
		</div>
	</div>
</div>
