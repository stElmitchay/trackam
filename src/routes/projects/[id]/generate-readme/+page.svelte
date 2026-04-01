<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	const project = $derived(data.project);
	const githubConnected = $derived(data.githubConnected);

	let generating = $state(false);
	let pushing = $state(false);
	let readmeContent = $state('');
	let showRaw = $state(false);

	// Update content when form returns generated readme
	$effect(() => {
		if (form?.readme) {
			readmeContent = form.readme;
		}
	});
</script>

<div class="max-w-4xl mx-auto space-y-8">
	<a href="/projects/{project.id}" class="inline-flex items-center gap-1.5 glass-card px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-white/[0.06] transition-all duration-200">&larr; Back to project</a>

	<div>
		<h1 class="text-3xl font-display font-bold text-text tracking-tighter">Generate README</h1>
		<p class="text-sm text-text-muted mt-1">{project.title}</p>
	</div>

	{#if form?.error}
		<div class="glass-card p-3 text-sm text-danger" style="border-color: rgba(239, 68, 68, 0.3);">{form.error}</div>
	{/if}

	{#if form?.prUrl}
		<div class="glass-card p-4 text-sm text-success" style="border-color: rgba(34, 197, 94, 0.3);">
			PR created successfully! <a href={form.prUrl} target="_blank" rel="noopener" class="underline font-medium">View PR #{form.prNumber}</a>
		</div>
	{/if}

	{#if !githubConnected}
		<div class="glass-card p-8 text-center space-y-3">
			<p class="text-text-secondary">Connect your GitHub account to generate and push READMEs.</p>
			<a href="/auth/github" class="btn-primary px-5 py-2.5 text-sm inline-block">Connect GitHub</a>
		</div>
	{:else if !project.repo_url}
		<div class="glass-card p-8 text-center">
			<p class="text-text-secondary">This project has no repository URL. Add one to generate a README.</p>
		</div>
	{:else}
		<!-- Generate Button -->
		{#if !readmeContent}
			<div class="glass-card p-8 text-center space-y-4">
				<p class="text-text-secondary">AI will generate a comprehensive README based on your project details and repository.</p>
				<form
					method="POST"
					action="?/generate"
					use:enhance={() => {
						generating = true;
						return async ({ update }) => {
							generating = false;
							await update();
						};
					}}
				>
					<button type="submit" disabled={generating} class="btn-primary px-6 py-3 text-sm">
						{generating ? 'Generating...' : 'Generate README'}
					</button>
				</form>
			</div>
		{:else}
			<!-- Preview/Edit Toggle -->
			<div class="flex items-center justify-between">
				<div class="flex rounded-lg overflow-hidden border border-white/[0.06]">
					<button
						onclick={() => showRaw = false}
						class="px-4 py-2 text-xs font-medium transition-all duration-200
							{!showRaw ? 'bg-primary/20 text-primary-light' : 'text-text-muted hover:text-text hover:bg-white/[0.04]'}"
					>
						Preview
					</button>
					<button
						onclick={() => showRaw = true}
						class="px-4 py-2 text-xs font-medium transition-all duration-200
							{showRaw ? 'bg-primary/20 text-primary-light' : 'text-text-muted hover:text-text hover:bg-white/[0.04]'}"
					>
						Edit
					</button>
				</div>
				<div class="flex gap-2">
					<form
						method="POST"
						action="?/generate"
						use:enhance={() => {
							generating = true;
							return async ({ update }) => {
								generating = false;
								await update();
							};
						}}
					>
						<button type="submit" disabled={generating} class="btn-secondary px-4 py-2 text-sm">
							{generating ? 'Regenerating...' : 'Regenerate'}
						</button>
					</form>
					<form
						method="POST"
						action="?/pushPr"
						use:enhance={() => {
							pushing = true;
							return async ({ update }) => {
								pushing = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="readme" value={readmeContent} />
						<button type="submit" disabled={pushing} class="btn-primary px-4 py-2 text-sm">
							{pushing ? 'Creating PR...' : 'Push as PR'}
						</button>
					</form>
				</div>
			</div>

			<!-- Content -->
			{#if showRaw}
				<textarea
					bind:value={readmeContent}
					class="glass-input w-full px-4 py-4 text-sm text-text font-mono leading-relaxed"
					rows="30"
				></textarea>
			{:else}
				<div class="glass-card p-8 prose prose-invert prose-sm max-w-none">
					{@html readmeContent
						.replace(/^### (.*$)/gm, '<h3>$1</h3>')
						.replace(/^## (.*$)/gm, '<h2>$1</h2>')
						.replace(/^# (.*$)/gm, '<h1>$1</h1>')
						.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
						.replace(/\*(.*?)\*/g, '<em>$1</em>')
						.replace(/`(.*?)`/g, '<code class="glass-input px-1.5 py-0.5 text-xs">$1</code>')
						.replace(/^- (.*$)/gm, '<li>$1</li>')
						.replace(/\n\n/g, '</p><p>')
						.replace(/\n/g, '<br />')
					}
				</div>
			{/if}
		{/if}
	{/if}
</div>
