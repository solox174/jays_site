<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { isBusy } from '$lib/stores/ui';
	import { theme } from '$lib/stores/colorScheme.svelte';
	import logo from '$lib/assets/images/jays_auto.svg';

	let { children } = $props();
	let mouseX = $state(0);
	let mouseY = $state(0);
	let menuOpen = $state(false);
	// svelte-ignore non_reactive_update
	let navEl: HTMLElement | null = null;
	let phone: HTMLSpanElement;
	let email: HTMLSpanElement;

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
<div style="display: flex; flex-direction: column; height: 100dvh">
	<div>
		<div style="position: relative; display: flex; justify-content: center; padding: 16px 0">
			<img src="{logo}" alt="logo" style="height: 200px; width: auto;" />
			<!--
			TODO: add dropdown (use mobile dropdown as template) with
			     * edit profile (show "log in" instead if user not logged in)
			     * dark/light toggle
			     consider refactoring both into a Component
			-->
			<i title="{theme.current === 'dark' ? 'light' : 'dark'} mode"
			   id="toggle-color-scheme"
			   onclick={toggleTheme}
			   onkeydown="{void(0)}" tabindex="0" role="button"
			   data-dark-mode={theme.current === 'dark'}
			   class="fa-solid fa-gear"
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

	<main style="flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; padding: 30px 0 45px; box-sizing: border-box">
		{@render children()}
	</main>

	<div style="position: fixed; bottom: 0; left: 0; right: 0; background: var(--overlay-bg); backdrop-filter: blur(4px); padding: 5px 0; text-align: center; font-weight: 500">
		<i class="fa-solid fa-phone"></i>
		<a id="phone" title="phone" href="." onclick="{(e) => e.preventDefault()}" style="color: #aeaeae;"></a>
		<i class="fa-solid fa-envelope" style="margin-left: 10px"></i>
		<a id="email" title="email" href="." onclick="{(e) => e.preventDefault()}" style="color: #aeaeae;"></a>
		<span style="position: absolute; right: 16px; color: #aeaeae; font-size: 0.75rem">© 2026 Fasthold Inc.</span>
	</div>
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
	:global(html) {
		background-image:
				linear-gradient(rgba(150, 150, 150, 0.5),rgba(150, 150, 150, 0.5)),
				url('$lib/assets/images/background-2.jpeg');

		background-repeat: no-repeat;
		background-size: cover;
		background-position: center center;
		background-attachment: fixed;
		min-height: 100%;
	}
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
		background: var(--overlay-bg);
		backdrop-filter: blur(2px);
		pointer-events: auto;
		cursor: none;
	}
	#phone::before {
		content: '(480) 819-5443';
	}

	#email::before {
		content: 'jaysautocarcare@gmail.com';
	}

</style>
