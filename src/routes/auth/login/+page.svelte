<script lang="ts">
	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let fullName = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state('');
	let mode = $state<'login' | 'signup'>('login');

	const ALLOWED_DOMAIN = '@christex.foundation';

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		success = '';

		if (!email.endsWith(ALLOWED_DOMAIN)) {
			error = `Only ${ALLOWED_DOMAIN} emails are allowed.`;
			loading = false;
			return;
		}

		const supabase = data.supabase;

		if (mode === 'login') {
			const { error: err } = await supabase.auth.signInWithPassword({ email, password });
			if (err) {
				error = err.message;
				loading = false;
				return;
			}
			window.location.href = '/';
		} else {
			if (!fullName.trim()) {
				error = 'Full name is required.';
				loading = false;
				return;
			}

			const { error: err } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: { full_name: fullName.trim() }
				}
			});
			if (err) {
				error = err.message;
				loading = false;
				return;
			}

			success = 'Check your email for a confirmation link!';
		}

		loading = false;
	}
</script>

<div class="flex min-h-[80vh] items-center justify-center">
	<div class="relative w-full max-w-sm">
		<!-- Ambient glow behind the card -->
		<div class="absolute -z-10 w-[400px] h-[400px] bg-primary/15 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

		<div class="glass-card p-8 space-y-6">
			<div class="text-center">
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white text-2xl font-bold shadow-[0_0_40px_rgba(139,92,246,0.3)] ring-1 ring-white/10">
					S
				</div>
				<h1 class="mt-5 text-3xl font-display font-bold text-text tracking-tighter">Sinai Tracker</h1>
				<p class="mt-1 text-sm text-text-muted">{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>
			</div>

			{#if error}
				<div class="glass-card p-3 text-sm text-danger" style="border-color: rgba(239, 68, 68, 0.3);">{error}</div>
			{/if}

			{#if success}
				<div class="glass-card p-3 text-sm text-success" style="border-color: rgba(34, 197, 94, 0.3);">{success}</div>
			{:else}
				<form onsubmit={handleSubmit} class="space-y-4">
					{#if mode === 'signup'}
						<div>
							<label for="fullName" class="block text-sm font-medium text-text mb-1">Full Name</label>
							<input
								id="fullName"
								type="text"
								bind:value={fullName}
								placeholder="Your full name"
								required
								class="glass-input w-full px-4 py-2.5 text-sm text-text"
							/>
						</div>
					{/if}
					<div>
						<label for="email" class="block text-sm font-medium text-text mb-1">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="you{ALLOWED_DOMAIN}"
							required
							class="glass-input w-full px-4 py-2.5 text-sm text-text"
						/>
						<p class="mt-1 text-xs text-text-muted">Only {ALLOWED_DOMAIN} emails allowed</p>
					</div>
					<div>
						<label for="password" class="block text-sm font-medium text-text mb-1">Password</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							placeholder="••••••••"
							required
							minlength="6"
							class="glass-input w-full px-4 py-2.5 text-sm text-text"
						/>
					</div>
					<button
						type="submit"
						disabled={loading}
						class="btn-primary w-full py-3 text-sm"
					>
						{loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
					</button>
				</form>

				<p class="text-center text-sm text-text-muted">
					{#if mode === 'login'}
						Don't have an account?
						<button onclick={() => { mode = 'signup'; error = ''; }} class="text-primary-light hover:text-primary transition-colors">Sign up</button>
					{:else}
						Already have an account?
						<button onclick={() => { mode = 'login'; error = ''; }} class="text-primary-light hover:text-primary transition-colors">Sign in</button>
					{/if}
				</p>
			{/if}
		</div>
	</div>
</div>
