<script lang="ts">
	import '../app.css';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';

	const isSplashVisible = writable(false);
	let showSplash = false;
	isSplashVisible.subscribe((v) => (showSplash = v));

	let isFirstLoad = true;

	if (browser) {
		beforeNavigate(({ to }) => {
			const isToTestWithQuery = to?.url.pathname === '/test' && to?.url.searchParams.has('q');
			if (!isFirstLoad && !isToTestWithQuery) {
				isSplashVisible.set(true);
			}
		});

		afterNavigate(() => {
			setTimeout(() => {
				isSplashVisible.set(false);
				isFirstLoad = false;
			}, 800);
		});
	}
</script>

<slot />

{#if showSplash}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-300 to-blue-400 transition-opacity duration-300"
		style="pointer-events: none"
	>
		<img src="/img/logo.png" alt="Splash" class="h-[55vw] animate-bounce" />
	</div>
{/if}

<style>
	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}
	.animate-bounce {
		animation: bounce 1s infinite;
	}
</style>
