<script lang="ts">
    import {onMount} from 'svelte';
    import type {Schema} from "../../../amplify/data/resource";

    type Props = {
        services?: Schema['Service']['createType'][];
        selectedIds?: (string | undefined)[];
        priceMap?: Map<string, number>;
        onSave?: (detail: { ids: (string | undefined)[] }) => void;
        onClose?: () => void;
    };

    let {
        services = [],
        selectedIds = [],
        priceMap,
        onSave,
        onClose
    }: Props = $props();

    function formatPrice(price: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    }

    let modalEl = $state<HTMLDivElement | null>(null);
    let selectedBaseServiceId = $state('');
    let selectedAddonIds = $state<(string | undefined)[]>([]);

    const visibleBaseServices = $derived(services.filter((service) => service.isExclusive));
    const visibleAddonServices = $derived(services.filter((service) => !service.isExclusive));

    const draftSelectedIds = $derived.by(() => {
        return [
            ...(selectedBaseServiceId ? [selectedBaseServiceId] : []),
            ...selectedAddonIds
        ];
    });

    onMount(() => {
        const selectedBase = services.find(
            (service) => selectedIds.includes(service.id ?? '') && service.isExclusive
        );
        const selectedAddons = services.filter(
            (service) => selectedIds.includes(service.id ?? '') && !service.isExclusive
        );

        selectedBaseServiceId = selectedBase?.id ?? '';
        selectedAddonIds = selectedAddons.map((service) => service.id);

        modalEl?.focus();
    });

    function close() {
        onClose?.();
    }

    function save() {
        onSave?.({ids: draftSelectedIds});
        onClose?.();
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            close();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            close();
        }
    }

    function handleBaseServiceChange(event: Event) {
        selectedBaseServiceId = (event.currentTarget as HTMLInputElement).value;
    }

    function handleAddonChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const id = input.value;

        if (input.checked) {
            if (!selectedAddonIds.includes(id)) {
                selectedAddonIds = [...selectedAddonIds, id];
            }
            return;
        }

        selectedAddonIds = selectedAddonIds.filter((existingId) => existingId !== id);
    }
</script>

<svelte:window onkeydown={handleKeydown}/>

<div class="backdrop" onclick={handleBackdropClick} role="presentation">
    <div aria-describedby="service-modal-description"
         aria-labelledby="service-modal-title"
         aria-modal="true"
         bind:this={modalEl}
         class="modal"
         role="dialog"
         tabindex="0">
        <div class="header">
            <div>
                <h2 id="service-modal-title">Select services</h2>
                <p id="service-modal-description">
                    Choose a detail and/or any individual treatments.
                </p>
            </div>

            <button aria-label="Close service modal"
                    class="icon-button"
                    onclick={close}
                    style="border-color: var(--btn-border); color: var(--btn-border)"
                    type="button">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="body">
            {#if services.length === 0}
                <div class="empty-state">
                    <h3>No services</h3>
                    <p>There are no services available to select.</p>
                </div>
            {:else}
                {#if visibleBaseServices.length > 0}
                    <fieldset class="service-group">
                        <legend>Details</legend>

                        <div class="service-list" role="list">
                            {#each visibleBaseServices as service (service.id)}
                                <label class="service-item" role="listitem">
                                    <span class="service-control">
                                        <input type="radio"
                                               name="base-service"
                                               value={service.id}
                                               checked={selectedBaseServiceId === service.id}
                                               onchange={handleBaseServiceChange}/>
                                    </span>

                                    <span class="service-content">
                                        <span class="service-top">
                                            <strong>{service.name}</strong>
                                            {#if priceMap?.has(service.id ?? '')}
                                                <span>{formatPrice(priceMap.get(service.id ?? '')!)}</span>
                                            {/if}
                                        </span>

                                        <span class="service-description">{service.description}</span>
                                    </span>
                                </label>
                            {/each}
                        </div>
                    </fieldset>
                {/if}

                {#if visibleAddonServices.length > 0}
                    <fieldset class="service-group">
                        <legend>Treatments</legend>

                        <div class="service-list" role="list">
                            {#each visibleAddonServices as service (service.id)}
                                <label class="service-item" role="listitem">
                                    <span class="service-control">
                                        <input type="checkbox"
                                               value={service.id}
                                               checked={selectedAddonIds.includes(service.id)}
                                               onchange={handleAddonChange}/>
                                    </span>

                                    <span class="service-content">
                                        <span class="service-top">
                                            <strong>{service.name}</strong>
                                            {#if priceMap?.has(service.id ?? '')}
                                                <span>{formatPrice(priceMap.get(service.id ?? '')!)}</span>
                                            {/if}
                                        </span>

                                        <span class="service-description">{service.description}</span>
                                    </span>
                                </label>
                            {/each}
                        </div>
                    </fieldset>
                {/if}
            {/if}
        </div>

        <div class="footer">
            <div class="selection-count">
                {draftSelectedIds.length} selected
            </div>

            <div class="footer-actions">
                <button class="secondary" onclick={close} type="button">Cancel</button>
                <button class="primary" disabled={draftSelectedIds.length === 0} onclick={save} type="button">Confirm
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: var(--overlay-bg);
        display: grid;
        place-items: center;
        padding: 1rem;
    }

    .modal {
        width: min(500px, 100%);
        max-height: min(70vh, 720px);
        background: var(--modal-bg);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-dialog);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        outline: none;
    }

    .header,
    .footer {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
    }

    .header {
        align-items: flex-start;
        border-bottom: 1px solid var(--modal-border);
    }

    .footer {
        align-items: center;
        border-top: 1px solid var(--modal-border);
        margin-top: auto;
    }

    .footer-actions {
        display: flex;
        gap: 0.5rem;
    }

    h2 {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
    }

    p {
        margin: 0;
    }

    .body {
        flex: 1;
        min-height: 0;
        padding: 1rem;
        overflow: auto;
    }

    .service-group {
        margin: 0 0 1rem 0;
        padding: 0;
        border: 0;
    }

    .service-group legend {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 700;
    }

    .service-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .service-item {
        display: grid;
        grid-template-columns: 24px 1fr;
        gap: 0.75rem;
        align-items: start;
        padding: 0.9rem;
        border: 1px solid var(--modal-border);
        border-radius: var(--border-radius);
        background: var(--modal-item-bg);
        cursor: pointer;
    }

    .service-item:hover {
        background: var(--modal-item-bg-hover);
        border-color: var(--modal-border);
    }

    .service-item:has(.service-control input[type="radio"]:checked) {
        border-color: var(--brand-color);
    }

    .service-control {
        padding-top: 0.15rem;
    }

    .service-control input {
        width: 1rem;
        height: 1rem;
        margin: 0;
    }

    .service-content {
        min-width: 0;
    }

    .service-top {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: baseline;
        margin-bottom: 0.35rem;
    }

    .service-top strong {
        font-size: 1rem;
    }

    .service-top span {
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
    }

    .service-description {
        display: block;
        line-height: 1.45;
    }

    .empty-state {
        border: 1px dashed var(--modal-border);
        border-radius: var(--border-radius);
        padding: 1rem;
        background: var(--modal-item-bg);
    }

    .empty-state h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
    }

    .selection-count {
        font-size: 0.95rem;
    }

    .icon-button {
        border: 1px solid var(--modal-border);
        border-radius: var(--border-radius);
        font: inherit;
        background: var(--modal-bg);
        width: 2.25rem;
        height: 2.25rem;
        padding: 0;
    }

</style>