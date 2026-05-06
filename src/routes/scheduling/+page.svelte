<script lang="ts">
    import AppointmentForm from "$lib/component/AppointmentForm.svelte";
    import CreateAccount from "$lib/component/CreateAccount.svelte";
    import { isBusy } from '$lib/stores/ui';

    $isBusy = false;
    let { data }: PageProps = $props();
    const deferredDataPromise = data.deferred.data;
    let loggedIn = false;

</script>
{#if loggedIn}
    <AppointmentForm   {deferredDataPromise} />}
{:else}
    <CreateAccount/>
{/if}
