<script>
	import './layout.css';

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
