<script lang="ts">
	import { enhance } from '$app/forms';
	import ScrollReveal from '$lib/components/ui/ScrollReveal.svelte';

	let { data, form } = $props();
	let showForm = $state(false);
</script>

<div class="px-6 md:px-10 lg:px-16 py-10">
	<div class="flex items-baseline justify-between mb-10 animate-fade-up stagger-1">
		<div>
			<h1 class="heading-page">Tool Requests</h1>
			<p class="text-sm text-text-muted mt-1">Tools the company needs</p>
		</div>
		<button
			onclick={() => showForm = !showForm}
			class="{showForm ? 'btn-secondary' : 'btn-primary'} px-4 py-1.5 text-sm"
		>
			{showForm ? 'Cancel' : 'New Request'}
		</button>
	</div>

	{#if showForm}
		<form
			method="POST"
			action="?/create"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					showForm = false;
				};
			}}
			class="border border-border p-6 space-y-5 mb-10 animate-fade-up"
		>
			{#if form?.error}
				<div class="border border-negative text-negative text-sm px-3 py-2">{form.error}</div>
			{/if}
			<div>
				<label for="req-title" class="heading-section block mb-2">What do you need?</label>
				<input id="req-title" name="title" type="text" placeholder="e.g., Meeting Notes Summarizer" required class="input-editorial" />
			</div>
			<div>
				<label for="req-desc" class="heading-section block mb-2">Describe the problem</label>
				<textarea id="req-desc" name="description" rows="2" placeholder="What pain point does this solve?" required class="input-box"></textarea>
			</div>
			<div class="grid grid-cols-2 gap-6">
				<div>
					<label for="req-tool" class="heading-section block mb-2">Current Tool</label>
					<input id="req-tool" name="current_tool" type="text" placeholder="e.g., Otter.ai" class="input-editorial" />
				</div>
				<div>
					<label for="req-cost" class="heading-section block mb-2">Annual Cost ($)</label>
					<input id="req-cost" name="current_cost" type="number" placeholder="0" class="input-editorial" />
				</div>
			</div>
			<button type="submit" class="btn-primary px-5 py-2 text-sm">Submit Request</button>
		</form>
	{/if}

	<ScrollReveal>
		{#if data.requests.length > 0}
			{#each data.requests as request, i}
				<div class="flex gap-5 py-5 {i > 0 ? 'border-t border-border' : ''}">
					<!-- Upvote -->
					<form method="POST" action="?/upvote" use:enhance class="flex-shrink-0">
						<input type="hidden" name="id" value={request.id} />
						<button type="submit" class="flex flex-col items-center border border-border px-3 py-2 hover:bg-surface-alt hover:border-border-strong transition-all duration-150 w-12">
							<svg class="h-3 w-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
							</svg>
							<span class="text-sm text-data text-text mt-0.5">{request.upvotes ?? 0}</span>
						</button>
					</form>

					<div class="flex-1 min-w-0">
						<div class="flex items-center gap-2 mb-1">
							<h3 class="font-serif text-base text-text">{request.title}</h3>
							<span class="tag text-[10px]">{request.status}</span>
							{#if request.bonus_xp > 0}
								<span class="text-xs text-data text-text-muted">+{request.bonus_xp} XP</span>
							{/if}
						</div>
						<p class="text-sm text-text-secondary">{request.description}</p>
						<div class="mt-2 flex items-center gap-4 text-xs text-text-muted">
							{#if request.current_tool}
								<span>Current: {request.current_tool}</span>
							{/if}
							{#if request.current_cost}
								<span class="text-data text-negative">${((request.current_cost ?? 0) / 1000).toFixed(0)}K/yr</span>
							{/if}
							{#if request.requester}
								<span>by {request.requester.full_name}</span>
							{/if}
							{#if request.status === 'open'}
								<form method="POST" action="?/claim" use:enhance class="ml-auto">
									<input type="hidden" name="id" value={request.id} />
									<button type="submit" class="btn-primary px-3 py-1 text-xs">Claim</button>
								</form>
							{:else if request.status === 'claimed' && request.claimed_by === data.userId}
								<div class="ml-auto flex items-center gap-3">
									<span class="text-xs text-text-secondary">
										You claimed this
										{#if request.claimed_at}
											({Math.floor((Date.now() - new Date(request.claimed_at).getTime()) / (1000 * 60 * 60 * 24))}d ago)
										{/if}
									</span>
									<a href="/submit?request={request.id}" class="btn-primary px-3 py-1 text-xs">Submit</a>
								</div>
							{:else if request.claimer}
								<span class="ml-auto text-text-secondary">
									Claimed by {request.claimer.full_name}
									{#if request.claimed_at}
										({Math.floor((Date.now() - new Date(request.claimed_at).getTime()) / (1000 * 60 * 60 * 24))}d ago)
									{/if}
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{:else}
			<div class="py-20 text-center">
				<p class="text-sm text-text-muted">No requests yet. Be the first!</p>
			</div>
		{/if}
	</ScrollReveal>
</div>
