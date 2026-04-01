<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="sticky top-14 z-30 bg-bg/90 backdrop-blur-sm border-b border-border py-3 px-6 md:px-10 lg:px-16 flex flex-wrap items-center gap-3">
	{@render children()}
</div>
