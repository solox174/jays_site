<script lang="ts">
    import AppointmentForm from "$lib/component/AppointmentForm.svelte";
    import { isBusy } from '$lib/stores/ui';

    $isBusy = false;
    let { data } = $props();
</script>

<svelte:head>
    <title>Schedule</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<!-- TODO: move this components code back inline -->
<AppointmentForm deferredDataPromise={data.deferred.data} />