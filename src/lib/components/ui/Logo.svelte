<script lang="ts">
	let { size = 24, strokeWidth = 2 }: { size?: number; strokeWidth?: number } = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 128 128"
	fill="none"
	stroke="currentColor"
	stroke-width={strokeWidth}
	stroke-linecap="round"
	aria-hidden="true"
>
	<!-- Globe outline -->
	<circle cx="64" cy="64" r="38" />

	<!-- Equator -->
	<line x1="26" y1="64" x2="102" y2="64" />

	<!-- Front meridian -->
	<line x1="64" y1="26" x2="64" y2="102" />

	<!-- Front-facing longitude curves -->
	<path d="M 64 26 Q 50 64 64 102" />
	<path d="M 64 26 Q 78 64 64 102" />
	<path d="M 64 26 Q 36 64 64 102" />
	<path d="M 64 26 Q 92 64 64 102" />

	<!-- Front-facing latitude curves -->
	<path d="M 30 50 Q 64 56 98 50" />
	<path d="M 30 78 Q 64 72 98 78" />
</svg>
