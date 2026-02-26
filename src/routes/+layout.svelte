<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';

	let { children, data } = $props();
	let sidebarOpen = $state(true);
</script>

<div class="flex h-screen bg-bg text-text font-sans antialiased grain-overlay relative">
	<!-- Ambient background orbs -->
	<div class="ambient-orb w-[600px] h-[600px] bg-primary/20 top-[-200px] left-[-100px]"></div>
	<div class="ambient-orb w-[400px] h-[400px] bg-blue-500/10 bottom-[10%] right-[-100px]"></div>
	<div class="ambient-orb w-[300px] h-[300px] bg-accent/10 top-[50%] left-[30%]"></div>

	<Sidebar open={sidebarOpen} season={data.currentSeason} user={data.profile} />

	<div class="flex flex-1 flex-col overflow-hidden relative z-10">
		<Topbar
			onToggleSidebar={() => sidebarOpen = !sidebarOpen}
			user={data.profile}
			session={data.session}
		/>
		<main class="flex-1 overflow-y-auto">
			<div class="mx-auto max-w-7xl px-8 py-10 lg:px-12">
				{@render children()}
			</div>
		</main>
	</div>
</div>
