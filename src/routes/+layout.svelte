<script>
	import './layout.css';

	let { children } = $props();
</script>

<div>
	<div>
		<div style="display: flex; justify-content: center">
			<img src="/logo.jfif" style="aspect-ratio: 747/1024; height: 250px"/>
		</div>
		<div>
			<div style="display: flex; justify-content: space-between; margin: 0 auto; width: 300px; font-size: 1.5rem">
				<a href="/home">Home</a>
				<a href="/scheduling">Scheduling</a>
				<a href="/about">About</a>
			</div>
		</div>
		<div></div>
	</div>

	<main>
		{@render children()}
	</main>
</div>

<style>

</style>
