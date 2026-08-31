<script lang="ts">
    import type {PageProps} from './$types';
    import type {Service, ServicePrice} from '$lib/server/storage/types';
    import {ServiceType} from '$lib/types';
    import EditServiceModal from '$lib/component/EditServiceModal.svelte';

    let {data, form}: PageProps = $props();
    // Derived, not $state — must stay reactive to a fresh load() after save/delete
    // (invalidateAll(), triggered by the modal's own form enhance), the same class of
    // bug fixed on the scheduling page earlier: a one-time $state snapshot would go
    // stale after the first edit and never reflect subsequent changes.
    let services = $derived(data.services as Service[]);
    let prices = $derived(data.prices as ServicePrice[]);

    const serviceTypes = Object.values(ServiceType);
    let activeType = $state(serviceTypes[0]);

    // undefined = modal closed, null = "add" mode, a Service = "edit" mode
    let editingService = $state<Service | null | undefined>(undefined);

    function openAdd() {
        editingService = null;
    }

    function openEdit(service: Service) {
        editingService = service;
    }

    function closeModal() {
        editingService = undefined;
    }

    function handleItemKeydown(event: KeyboardEvent, service: Service) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openEdit(service);
        }
    }

    const editingPrices = $derived(
        editingService ? prices.filter(p => p.serviceId === editingService!.id) : []
    );
</script>

<svelte:head>
    <title>Manage Services</title>
</svelte:head>

<div class="glass-panel">
    <div class="tab-container">
        <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
        <nav aria-label="Service Tabs" class="tab-nav" role="tablist" style="display: flex; align-items: stretch;">
            <div class="tabs">
                {#each serviceTypes as serviceType}
                    <button aria-selected={activeType === serviceType}
                            class="tab-button"
                            class:active={activeType === serviceType}
                            onclick={() => activeType = serviceType}
                            role="tab">
                        {serviceType}
                    </button>
                    <div style="width: 5px"></div>
                {/each}
            </div>
            <div id="spacer" style="flex-grow: 1; margin-right:15px"></div>
            <button class="add-button" onclick={openAdd} type="button">+ Add Service</button>
        </nav>

        <div class="tab-content">
            {#each services.filter(service => service.serviceType === activeType) as service (service.id)}
                <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                <div class="service-item"
                     onclick={() => openEdit(service)}
                     onkeydown={(e) => handleItemKeydown(e, service)}
                     role="button"
                     tabindex="0">
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                </div>
            {:else}
                <p class="empty">No services in this category yet.</p>
            {/each}
        </div>
    </div>
</div>

{#if editingService !== undefined}
    <EditServiceModal
        defaultServiceType={activeType}
        errorMessage={form?.message}
        onClose={closeModal}
        prices={editingPrices}
        service={editingService}
    />
{/if}

<style>
    :root {
        --tab-border-color: color-mix(in srgb, var(--btn-text-color-disabled) 60%, #000);
    }

    :root[data-theme="dark"] {
        --tab-border-color: color-mix(in srgb, var(--btn-text-color-disabled) 60%, #fff);
    }

    .tab-container {
        width: 100%;
        max-width: 700px;
        margin: 20px auto;
    }

    .tab-nav {
        display: flex;
        align-items: center;
    }

    .tabs {
        display: flex;
    }

    .tabs > *, #spacer {
        border-bottom: 2px solid var(--brand-color) !important;
    }

    .tab-button {
        color: rgb(0 0 0 / 30%) !important;
        padding: 10px 20px;
        border: 1px solid var(--tab-border-color) !important;
        font-weight: 600;
        border-radius: 4px 4px 0 0;
        transition: all 0.2s ease;
        background-color: rgb(0 0 0 / 5%) !important;
        border-bottom: 2px solid var(--brand-color) !important;
    }

    .tab-button:hover {
        background-color: rgb(0 0 0 / 10%) !important;
    }

    .tab-button.active {
        background-color: transparent !important;
        color: black !important;
        border: 2px solid var(--brand-color) !important;
        border-bottom: none !important;
        box-shadow: none !important;
    }

    :root[data-theme="dark"] {
        .tab-button {
            color: rgb(255 255 255 / 30%) !important;
            background-color: rgb(255 255 255 / 5%) !important;
        }

        .tab-button.active {
            background-color: transparent !important;
            color: white !important;
        }

        .tab-button:hover {
            background-color: rgb(255 255 255 / 10%) !important;
        }
    }

    .add-button {
        white-space: nowrap;
    }

    .tab-content {
        border-top: none;
        padding: 20px;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .service-item {
        padding: 0.9rem 1rem;
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        background: var(--item-bg);
        cursor: pointer;
        transition: background 160ms ease, border-color 160ms ease;
    }

    .service-item:hover {
        background: var(--item-bg-hover);
    }

    .service-item h3 {
        margin: 0 0 4px;
        font-weight: bold;
    }

    .service-item p {
        margin: 0;
        color: var(--label-color);
    }

    .empty {
        padding: 20px;
        border: 1px dashed var(--overlay-border);
        border-radius: var(--border-radius);
        background: var(--item-bg);
        font-size: 14px;
        text-align: center;
    }
</style>
