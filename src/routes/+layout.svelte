<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { isBusy } from '$lib/stores/ui';
	import { theme } from '$lib/stores/colorScheme.svelte';

	let { children } = $props();
	let mouseX = $state(0);
	let mouseY = $state(0);
	let menuOpen = $state(false);
	let navEl: HTMLElement | null = null;

	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	function toggleTheme(e: MouseEvent) {
		e.preventDefault();
		theme.toggle();
		document.documentElement.setAttribute('data-theme', theme.current);
	}

	function handleWindowClick(e: MouseEvent) {
		if (menuOpen && navEl && !navEl.contains(e.target as Node)) {
			menuOpen = false;
		}
	}
</script>

<svelte:window onmousemove={handleMouseMove} onclick={handleWindowClick} />
<div>
	<div style="margin-bottom: 20px">
		<div style="position: relative; display: flex; justify-content:  center; padding: 40px 0">
			<img src="/logo.png" alt="logo" style="aspect-ratio: 1392/876; height: 150px"/>
			<i title="{theme.current === 'dark' ? 'light' : 'dark'} mode"
			   id="toggle-color-scheme"
			   onclick={toggleTheme}
			   onkeydown="{void(0)}" tabindex="0" role="button"
			   data-dark-mode={theme.current === 'dark'}
			   class="fa-solid {theme.current === 'dark' ? 'fa-sun' : 'fa-moon'}"
			   style="position: absolute; margin-top: 40px; top: 0; right: 0; font-size: 1.3rem"></i>
		</div>
		{#if page.url.pathname !== '/login'}
		<nav class="site-nav" bind:this={navEl}>
			<div class="nav-desktop">
				<a class:active-nav="{page.url.pathname === '/'}" href="/">Home</a>
				<a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling">Scheduling</a>
				<a class:active-nav="{page.url.pathname === '/services'}" href="/services">Services</a>
			</div>

			<div class="nav-mobile">
				<button class="hamburger" onclick={() => menuOpen = !menuOpen} aria-label="Menu" aria-expanded={menuOpen}>
					<i class="fa-solid {menuOpen ? 'fa-xmark' : 'fa-bars'}"></i>
				</button>
				{#if menuOpen}
				<div class="nav-dropdown">
					<a class:active-nav="{page.url.pathname === '/'}" href="/" onclick={() => menuOpen = false}>Home</a>
					<a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling" onclick={() => menuOpen = false}>Scheduling</a>
					<a class:active-nav="{page.url.pathname === '/services'}" href="/services" onclick={() => menuOpen = false}>Services</a>
				</div>
				{/if}
			</div>
		</nav>
		{/if}
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
	#toggle-color-scheme[data-dark-mode="false"] {
		color: black!important;
	}
	#toggle-color-scheme[data-dark-mode="true"] {
		color: white;
	}
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

	.nav-desktop {
		display: flex;
		justify-content: space-between;
		margin: 0 auto;
		width: 400px;
		font-size: 1.5rem;
	}

	.nav-mobile {
		display: none;
		position: relative;
		text-align: center;
	}

	.hamburger {
		background: none;
		border: none;
		box-shadow: none;
		font-size: 1.5rem;
		color: var(--color-text-strong);
		cursor: pointer;
		padding: 0.25rem 0.75rem;
	}

	.nav-dropdown {
		position: absolute;
		top: calc(100% + 0.5rem);
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		background: var(--color-modal-bg);
		border: 1px solid var(--color-border-soft);
		border-radius: var(--border-radius);
		box-shadow: var(--shadow-modal);
		z-index: 100;
		display: flex;
		flex-direction: column;
	}

	.nav-dropdown a {
		padding: 0.75rem 1.25rem;
		font-size: 1.2rem;
		border-bottom: 1px solid var(--color-border-soft);
	}

	.nav-dropdown a:last-child {
		border-bottom: none;
	}

	@media (max-width: 640px) {
		.nav-desktop { display: none; }
		.nav-mobile { display: block; }
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
		left: calc(50% - (var(--size)/2));
		bottom: -10px;
		position: absolute;
		border: var(--size) solid transparent;
		border-bottom: var(--size) solid var(--color-active-nav-indicator)
	}
</style>
