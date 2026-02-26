<script lang="ts">
	let {
		label,
		value,
		subtitle = '',
		trend = '',
		accent = 'primary'
	}: {
		label: string;
		value: string;
		subtitle?: string;
		trend?: string;
		accent?: 'primary' | 'success' | 'accent' | 'danger';
	} = $props();

	const accentColors: Record<string, string> = {
		primary: 'from-primary/60 to-primary-light/40',
		success: 'from-success/60 to-emerald-400/40',
		accent: 'from-accent/60 to-amber-300/40',
		danger: 'from-danger/60 to-red-400/40',
	};
</script>

<div class="glass-card p-6">
	<div class="h-0.5 w-10 rounded-full bg-gradient-to-r {accentColors[accent] ?? accentColors.primary} mb-4"></div>
	<p class="text-xs font-medium text-text-muted uppercase tracking-widest">{label}</p>
	<p class="mt-2 text-3xl font-bold text-text font-mono tabular-nums tracking-tight">{value}</p>
	{#if subtitle}
		<p class="mt-1 text-xs text-text-muted">{subtitle}</p>
	{/if}
	{#if trend}
		<p class="mt-2 text-xs font-medium text-success">{trend}</p>
	{/if}
</div>
