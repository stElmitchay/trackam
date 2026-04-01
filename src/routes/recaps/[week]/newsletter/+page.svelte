<script lang="ts">
	let { data } = $props();
	const newsletter = $derived(data.newsletter);
	const cycle = $derived(data.cycle);

	function markdownToHtml(md: string): string {
		return md
			.replace(/^#### (.*$)/gm, '<h4 class="text-sm font-semibold text-text mt-6 mb-2">$1</h4>')
			.replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-text mt-8 mb-3">$1</h3>')
			.replace(/^## (.*$)/gm, '<h2 class="text-lg font-serif text-text mt-10 mb-3">$1</h2>')
			.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-serif text-text mt-10 mb-4">$1</h1>')
			.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text">$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>')
			.replace(/`(.*?)`/g, '<code class="text-xs bg-surface-alt px-1.5 py-0.5">$1</code>')
			.replace(/^- (.*$)/gm, '<li class="ml-4 text-sm text-text-secondary leading-relaxed">$1</li>')
			.replace(/^\d+\. (.*$)/gm, '<li class="ml-4 text-sm text-text-secondary leading-relaxed list-decimal">$1</li>')
			.replace(/\n\n/g, '</p><p class="text-sm text-text-secondary leading-relaxed mb-3">')
			.replace(/\n/g, '<br />');
	}
</script>

<div class="max-w-3xl mx-auto px-6 md:px-10 py-10">
	<a href="/recaps/{cycle}" class="text-sm text-text-muted link-draw inline-block mb-8 animate-fade-up stagger-1">&larr; Back to Demo {cycle}</a>

	<div class="animate-fade-up stagger-1">
		<div class="flex items-center gap-3 mb-6">
			<h1 class="heading-page">{newsletter.title}</h1>
			<span class="tag text-[10px]">AI Generated</span>
		</div>

		<p class="text-xs text-text-muted mb-8">
			Generated {new Date(newsletter.generated_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
		</p>
	</div>

	<div class="animate-fade-up stagger-2 prose-editorial">
		{@html markdownToHtml(newsletter.content_markdown)}
	</div>
</div>
