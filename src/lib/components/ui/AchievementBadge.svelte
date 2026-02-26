<script lang="ts">
	let {
		icon,
		name,
		description = '',
		earned = false
	}: {
		icon: string;
		name: string;
		description?: string;
		earned?: boolean;
	} = $props();
</script>

<div class="flex flex-col items-center gap-1.5 transition-all duration-300 {earned ? 'hover:scale-105' : ''}" title={description}>
	<div
		class="flex h-12 w-12 items-center justify-center rounded-xl text-lg transition-all duration-300
			{earned
			? 'bg-accent/10 ring-1 ring-accent/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.3)]'
			: 'bg-white/[0.03] opacity-30 grayscale'}"
	>
		{icon}
	</div>
	<span class="text-xs font-medium {earned ? 'text-text' : 'text-text-muted'}">{name}</span>
</div>
