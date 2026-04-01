<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, class: className = '', delay = 0 }: {
		children: Snippet;
		class?: string;
		delay?: number;
	} = $props();

	let el: HTMLDivElement | undefined = $state();
	let visible = $state(false);

	$effect(() => {
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					visible = true;
					observer.disconnect();
				}
			},
			{ threshold: 0.1 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={el}
	class="reveal {visible ? 'visible' : ''} {className}"
	style={delay ? `transition-delay: ${delay}ms` : ''}
>
	{@render children()}
</div>
