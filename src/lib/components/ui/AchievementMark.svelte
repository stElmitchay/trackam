<script lang="ts">
	let { icon = '', name = '', earned = false }: {
		icon?: string;
		name?: string;
		earned?: boolean;
	} = $props();
</script>

<div
	class="flex items-center justify-center w-10 h-10 border text-sm transition-all duration-200
		{earned
			? 'border-text bg-text text-bg'
			: 'border-border bg-transparent text-text-muted'}"
	title={name}
>
	{icon}
</div>
