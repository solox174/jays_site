<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { isBusy } from '$lib/stores/ui';
	import { theme } from '$lib/stores/colorScheme.svelte';
	import logo from '$lib/assets/images/jays_auto.svg';

	let { children, data } = $props();
	let mouseX = $state(0);
	let mouseY = $state(0);
	let mobileMenuOpen = $state(false);
	let settingsMenuOpen = $state(false);
	// svelte-ignore non_reactive_update
	let navEl: HTMLElement | null = null;
	// svelte-ignore non_reactive_update
	let navBtnEl: HTMLElement | null = null;
	// svelte-ignore non_reactive_update
	let settingsEl: HTMLElement | null = null;

	function handleMouseMove(event: MouseEvent) {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	function toggleTheme() {
		theme.toggle();
		document.documentElement.setAttribute('data-theme', theme.current);
	}

	function handleWindowClick(e: MouseEvent) {
		if (settingsEl) {
			if (settingsEl.querySelector('button')?.contains(e.target as Node)) {
				settingsMenuOpen = !settingsMenuOpen;
			} else if (!settingsEl.contains(e.target as Node)) {
				settingsMenuOpen = false;
			}
		}
		if (navBtnEl) {
			if (navBtnEl.contains(e.target as Node)) {
				mobileMenuOpen = !mobileMenuOpen;
			} else if (!navEl?.contains(e.target as Node)) {
				mobileMenuOpen = false;
			}
		}
	}
</script>

<svelte:window onmousemove={handleMouseMove} onclick={handleWindowClick} />
<div style="display: flex; flex-direction: column; height: 100dvh">
	<div>
		<div style="position: relative; display: flex; justify-content: center; padding: 16px 0">
			<img id="hero" src="{logo}" alt="logo" style="height: 200px; width: auto;" />
			<!-- TODO: consider refactoring menu here and for mobile into a Component. Low priority  -->
			<button class="bare-btn nav-mobile-trigger"
					bind:this={navBtnEl} aria-label="Menu"
					aria-expanded={mobileMenuOpen}
					style="padding-left: 0">
				<i class="fa-solid fa-bars"></i>
			</button>
	
			<div class="nav-settings" bind:this={settingsEl} style="position: absolute; margin-top: 20px; top: 0; right: 0; font-size: 1.3rem">
				<button class="bare-btn" aria-label="Settings" aria-expanded={settingsMenuOpen} style="padding-right: 0">
					<i class="fa-solid fa-user-gear" style="font-size: 1.5rem"></i>
				</button>
				{#if settingsMenuOpen}
					<div class="nav-dropdown" style="width: 250px">
						{#if data.loggedIn}
							<a href="/profile">Edit Profile</a>
						{:else}
							<a href="/login">Log In</a>
						{/if}
						<a style="display: flex; justify-content: space-between; align-items: center;" href="." onclick="{(e) => e.preventDefault()}">
							<span id="theme-toggle-label">{theme.current === 'dark' ? 'Light' : 'Dark'} Theme</span>
							<!-- TODO: could be a Component. Low priority -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<label class="switch" onclick={(e) => e.stopPropagation()}>
								<input type="checkbox" checked={theme.current === 'dark'} onchange={toggleTheme}>
								<span class="slider"></span>
							</label>
						</a>
					</div>
				{/if}
			</div>
		</div>
		{#if page.url.pathname !== '/login'}
		<nav class="site-nav">
			<div class="nav-desktop">
				<a class:active-nav="{page.url.pathname === '/'}" href="/">Home</a>
				<a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling">Scheduling</a>
				<a class:active-nav="{page.url.pathname === '/services'}" href="/services">Services</a>
			</div>

			<div class="nav-mobile" bind:this={navEl}>
				{#if mobileMenuOpen}
				<div class="nav-dropdown">
					<a class:active-nav="{page.url.pathname === '/'}" href="/" onclick={() => mobileMenuOpen = false}>Home</a>
					<a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling" onclick={() => mobileMenuOpen = false}>Scheduling</a>
					<a class:active-nav="{page.url.pathname === '/services'}" href="/services" onclick={() => mobileMenuOpen = false}>Services</a>
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

	/* The container */
	.switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 20px;
	}

	/* Hide default HTML checkbox */
	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* The track (slider) */
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0; left: 0; right: 0; bottom: 0;
		background-color: #ccc;
		transition: .4s;
		border-radius: 34px;
	}

	/* The sliding knob */
	.slider:before {
		position: absolute;
		content: "";
		height: 12px; width: 12px;
		left: 4px; bottom: 4px;
		background-color: #4a4a4a;
		transition: .4s;
		border-radius: 50%;
	}

	/* When the checkbox is checked: change track color and move knob */
	input:checked + .slider {
		background-color: var(--btn-border);
	}

	input:checked + .slider:before {
		transform: translateX(30px);
	}


</style>
