<script>
	import './layout.css';
	import {page} from "$app/state";

	let { children } = $props();
</script>

<div>
	<div>
		<div style="display: flex; justify-content: center; margin: 20px 0">
			<img src="/logo.png" alt="logo" style="aspect-ratio: 1392/876; height: 150px"/>
		</div>
		<!--<div style="transform: rotate(90deg); position: fixed; right: -50%; background: black; width:100%; padding:25px 0 5px 0px">
			<div style="display: flex; justify-content: space-between; margin: 0 auto; width: 300px; font-size: 1.3rem">-->
		<div>
			<div style="display: flex; justify-content: space-between; margin: 0 auto; width: 400px; font-size: 1.5rem">
				<!-- talk about "truthy" -->
				<a class:active-nav="{page.url.pathname === '/'}" href="/">Home</a>
				<a class:active-nav="{page.url.pathname === '/scheduling'}" href="/scheduling">Scheduling</a>
				<a class:active-nav="{page.url.pathname === '/services'}" href="/services">Services</a>
				<a class:active-nav="{page.url.pathname === '/about'}" href="/about">About</a>
			</div>
		</div>
		<div></div>
	</div>

	<main>
		{@render children()}
	</main>
</div>

<style>
	.active-nav {
		position: relative;
	}
	.active-nav::before {
		--size: 7px;
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
