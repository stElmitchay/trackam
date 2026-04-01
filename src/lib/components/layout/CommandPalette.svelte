<script lang="ts">
	let { open = false, onClose }: {
		open: boolean;
		onClose: () => void;
	} = $props();

	let query = $state('');
	let selectedIndex = $state(0);
	let inputEl: HTMLInputElement | undefined = $state();

	const pages = [
		{ label: 'Home', href: '/', section: 'Pages' },
		{ label: 'Projects', href: '/projects', section: 'Pages' },
		{ label: 'Submit Project', href: '/submit', section: 'Pages' },
		{ label: 'Leaderboard', href: '/leaderboard', section: 'Pages' },
		{ label: 'Builders', href: '/profiles', section: 'Pages' },
		{ label: 'Analytics', href: '/analytics', section: 'Pages' },
		{ label: 'Recaps', href: '/recaps', section: 'Pages' },
		{ label: 'Challenges', href: '/challenges', section: 'Pages' },
		{ label: 'Catalog', href: '/catalog', section: 'Pages' },
		{ label: 'Tool Requests', href: '/requests', section: 'Pages' },
		{ label: 'Profile', href: '/profile', section: 'Pages' },
	];

	let filtered = $derived(
		query.trim()
			? pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()))
			: pages
	);

	$effect(() => {
		if (open && inputEl) {
			query = '';
			selectedIndex = 0;
			// Small delay to ensure DOM is ready
			setTimeout(() => inputEl?.focus(), 50);
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
		}
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, 0);
		}
		if (e.key === 'Enter' && filtered[selectedIndex]) {
			window.location.href = filtered[selectedIndex].href;
			onClose();
		}
	}

	function navigate(href: string) {
		window.location.href = href;
		onClose();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-[200] bg-bg/60 backdrop-blur-sm" role="presentation">
		<button class="absolute inset-0 w-full h-full cursor-default" onclick={onClose} aria-label="Close palette" tabindex="-1"></button>
	</div>

	<!-- Palette -->
	<div
		class="fixed top-[15%] left-1/2 -translate-x-1/2 z-[201] w-full max-w-lg bg-surface border border-border shadow-2xl animate-fade-up"
		role="combobox"
		aria-expanded="true"
		aria-controls="palette-results"
	>
		<!-- Search input -->
		<div class="flex items-center gap-3 px-4 py-3 border-b border-border">
			<svg class="h-4 w-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
			<input
				bind:this={inputEl}
				bind:value={query}
				onkeydown={handleKeydown}
				placeholder="Search pages..."
				class="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
			/>
			<kbd class="text-[10px] text-text-muted border border-border px-1.5 py-0.5 font-mono">ESC</kbd>
		</div>

		<!-- Results -->
		<div id="palette-results" class="max-h-72 overflow-y-auto py-2">
			{#each filtered as item, i}
				<button
					onclick={() => navigate(item.href)}
					class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-100
						{i === selectedIndex ? 'bg-surface-alt text-text' : 'text-text-secondary hover:bg-surface-alt hover:text-text'}"
				>
					<span class="flex-1">{item.label}</span>
					<span class="text-xs text-text-muted font-mono">{item.href}</span>
				</button>
			{/each}
			{#if filtered.length === 0}
				<div class="px-4 py-6 text-center text-sm text-text-muted">
					No results found
				</div>
			{/if}
		</div>
	</div>
{/if}
