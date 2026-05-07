<script lang="ts">
    import AppointmentForm from "$lib/component/AppointmentForm.svelte";
    import { isBusy } from '$lib/stores/ui';

    $isBusy = false;
    let { data } = $props();
</script>

<AppointmentForm deferredDataPromise={data.deferred.data} />