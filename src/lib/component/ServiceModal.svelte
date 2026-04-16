<script lang="ts">
    import { onMount } from 'svelte';
    import type {Schema} from "../../../amplify/data/resource";

    type Props = {
        services?: Schema['Service']['createType'][];
        selectedIds?: (string | undefined)[];
        onSave?: (detail: { ids: (string | undefined)[] }) => void;
        onClose?: () => void;
    };

    let {
        services = [],
        selectedIds = [],
        onSave,
        onClose
    }: Props = $props();

    let modalEl = $state<HTMLDivElement | null>(null);
    let filter = $state('');
    let selectedBaseServiceId = $state('');
    let selectedAddonIds = $state<(string | undefined)[]>([]);

    function formatPrice(price: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    const filteredServices = $derived.by(() => {
        const q = filter.trim().toLowerCase();
        if (!q) return services;

        return services.filter((service) => {
            return (
                service.name.toLowerCase().includes(q) ||
                service.description.toLowerCase().includes(q) ||
                formatPrice(service.price).toLowerCase().includes(q)
            );
        });
    });

    const visibleBaseServices = $derived.by((): typeof services => {
        return filteredServices.filter((service) => !service.addon);
    });

    const visibleAddonServices = $derived.by(() => {
        return filteredServices.filter((service) => service.addon);
    });

    const draftSelectedIds = $derived.by(() => {
        return [
            ...(selectedBaseServiceId ? [selectedBaseServiceId] : []),
            ...selectedAddonIds
        ];
    });

    onMount(() => {
        const selectedBase = services.find(
            (service) => {
                const serviceId = service.id ?? '';
                selectedIds.includes(serviceId) && !service.addon
            }
        );
        const selectedAddons = services.filter(
            (service) => {
                const serviceId = service.id ?? '';
                selectedIds.includes(serviceId) && service.addon
            }
        );

        selectedBaseServiceId = selectedBase?.id ?? '';
        selectedAddonIds = selectedAddons.map((service) => service.id);

        modalEl?.focus();
    });

    function close() {
        onClose?.();
    }

    function save() {
        onSave?.({ ids: draftSelectedIds });
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

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" role="presentation" onclick={handleBackdropClick}>
    <div
            class="modal"
            bind:this={modalEl}
            tabindex="0"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
            aria-describedby="service-modal-description"
    >
        <div class="header">
            <div>
                <h2 id="service-modal-title">Select services</h2>
                <p id="service-modal-description">
                    Choose a base service and any add-ons for this appointment.
                </p>
            </div>

            <button
                    type="button"
                    class="icon-button"
                    aria-label="Close service modal"
                    onclick={close}
            >
                ✕
            </button>
        </div>

        <div class="body">
            {#if services.length === 0}
                <div class="empty-state">
                    <h3>No services</h3>
                    <p>There are no services available to select.</p>
                </div>
            {:else}
                {#if filteredServices.length === 0}
                    <div class="empty-state">
                        <h3>No matches</h3>
                        <p>Try a different search term.</p>
                    </div>
                {:else}
                    {#if visibleBaseServices.length > 0}
                        <fieldset class="service-group">
                            <legend>Main service</legend>

                            <div class="service-list" role="list">
                                {#each visibleBaseServices as service (service.id)}
                                    <label class="service-item" role="listitem">
                                        <span class="service-control">
                                            <input
                                                    type="radio"
                                                    name="base-service"
                                                    value={service.id}
                                                    checked={selectedBaseServiceId === service.id}
                                                    onchange={handleBaseServiceChange}
                                            />
                                        </span>

                                        <span class="service-content">
                                            <span class="service-top">
                                                <strong>{service.name}</strong>
                                                <span>{formatPrice(service.price)}</span>
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
                            <legend>Add-ons</legend>

                            <div class="service-list" role="list">
                                {#each visibleAddonServices as service (service.id)}
                                    <label class="service-item" role="listitem">
                                        <span class="service-control">
                                            <input
                                                    type="checkbox"
                                                    value={service.id}
                                                    checked={selectedAddonIds.includes(service.id)}
                                                    onchange={handleAddonChange}
                                            />
                                        </span>

                                        <span class="service-content">
                                            <span class="service-top">
                                                <strong>{service.name}</strong>
                                                <span>{formatPrice(service.price)}</span>
                                            </span>

                                            <span class="service-description">{service.description}</span>
                                        </span>
                                    </label>
                                {/each}
                            </div>
                        </fieldset>
                    {/if}
                {/if}
            {/if}
        </div>

        <div class="footer">
            <div class="selection-count">
                {draftSelectedIds.length} selected
            </div>

            <div class="footer-actions">
                <button type="button" class="secondary" onclick={close}>Cancel</button>
                <button type="button" class="primary" onclick={save}>Apply</button>
            </div>
        </div>
    </div>
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: var(--color-overlay-background);
        display: grid;
        place-items: center;
        padding: 1rem;
    }

    .modal {
        width: min(500px, 100%);
        height: min(500px, calc(100dvh - 2rem));
        background: #fff;
        color: #111827;
        border-radius: var(--border-radius);
        box-shadow: 0 20px 60px rgb(0 0 0 / 0.3);
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
        border-bottom: 1px solid #e5e7eb;
    }

    .footer {
        align-items: center;
        border-top: 1px solid #e5e7eb;
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
        color: #6b7280;
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
        color: #374151;
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
        border: 1px solid #e5e7eb;
        border-radius: var(--border-radius);
        background: #f9fafb;
        cursor: pointer;
    }

    .service-item:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
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
        color: #111827;
    }

    .service-top span {
        white-space: nowrap;
        color: #111827;
        font-variant-numeric: tabular-nums;
        font-weight: 600;
    }

    .service-description {
        display: block;
        color: #4b5563;
        line-height: 1.45;
    }

    .empty-state {
        border: 1px dashed #d1d5db;
        border-radius: var(--border-radius);
        padding: 1rem;
        background: #fafafa;
        color: #6b7280;
    }

    .empty-state h3 {
        margin: 0 0 0.25rem 0;
        color: #111827;
        font-size: 1rem;
    }

    .selection-count {
        color: #4b5563;
        font-size: 0.95rem;
    }

    .secondary,
    .primary,
    .icon-button {
        border: 1px solid #d1d5db;
        border-radius: var(--border-radius);
        padding: 0.55rem 0.8rem;
        cursor: pointer;
        font: inherit;
    }

    .secondary,
    .icon-button {
        background: #fff;
        color: #111827;
    }

    .primary {
        background: #111827;
        color: #fff;
        border-color: #111827;
    }

    .icon-button {
        width: 2.25rem;
        height: 2.25rem;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        padding: 0;
    }
</style>