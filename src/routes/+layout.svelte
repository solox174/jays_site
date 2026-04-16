<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { isBusy } from '$lib/stores/ui';

	let { children } = $props();
	let mouseX = $state(0);
	let mouseY = $state(0);

	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}
</script>

<svelte:window onmousemove={handleMouseMove} />

<div>
	<div style="margin-bottom: 50px">
		<div style="display: flex; justify-content: center; margin: 40px 0">
			<img src="/logo.png" alt="logo" style="aspect-ratio: 1392/876; height: 150px"/>
		</div>
		<div>
			<div style="display: flex; justify-content: space-between; margin: 0 auto; width: 400px; font-size: 1.5rem">
				<a class:active-nav="{page.url.pathname === '/'}" href="/">Home</a>
				<a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling">Scheduling</a>
				<a class:active-nav="{page.url.pathname === '/services'}" href="/services">Services</a>
				<a class:active-nav="{page.url.pathname === '/about'}" href="/about">About</a>
			</div>
		</div>
		<div></div>
	</div>

	<main style="padding-top: 30px">
		{@render children()}
	</main>
</div>

<div class="cursor-spinner"
	 class:visible={$isBusy}
	 style:left={`${mouseX}px`}
	 style:top={`${mouseY}px`}
	 style="position: fixed; z-index: 9999"
	 aria-hidden="true">
	<i class="fa-solid fa-spinner fa-spin fa-3x"></i>
</div>
{#if $isBusy}
	<div class="busy-overlay" aria-hidden="true"></div>
{/if}

<style>
	.cursor-spinner {
		position: fixed;
		z-index: 9999;
		pointer-events: none;
		transform: translate(-50%, -50%);
		opacity: 0;
		visibility: hidden;
	}

	.cursor-spinner.visible {
		opacity: 1;
		visibility: visible;
	}

	.busy-overlay {
		position: fixed;
		inset: 0;
		z-index: 9998;
		background: var(--color-overlay-background);
		backdrop-filter: blur(2px);
		pointer-events: auto;
		cursor: none;
	}

	.active-nav {
		position: relative;
	}
	.active-nav::before {
		--size: 6px;
		content: '';
		margin: 0;
		padding: 0;
		width: 0;
		height: 0;
		left: calc(50% - var(--size));
		bottom: -10px;
		position: absolute;
		border: var(--size) solid transparent;
		border-bottom: var(--size) solid var(--color-theme-3);
	}
</style>
