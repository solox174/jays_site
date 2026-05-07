<script lang="ts">
    import CreateAccount from '$lib/component/CreateAccount.svelte';
    import LogIn from '$lib/component/LogIn.svelte';

    type View = 'choice' | 'login' | 'create';
    let view = $state<View>('choice');
</script>

{#if view === 'choice'}
    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem">
        <button onclick={() => view = 'login'}>Log in</button>
        <button onclick={() => view = 'create'}>Create account</button>
    </div>
{:else if view === 'login'}
    <LogIn />
{:else}
    <CreateAccount />
{/if}