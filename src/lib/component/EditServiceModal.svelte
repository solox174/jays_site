<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import {enhance} from '$app/forms';
    import {worseSelect} from 'worse-select';
    import type {SubmitFunction} from '@sveltejs/kit';
    import type {Service, ServicePrice, VehicleCategory} from '$lib/server/storage/types';
    import {ServiceType} from '$lib/types';

    type Props = {
        // null = "add new" mode, a Service = "edit" mode
        service?: Service | null;
        // Used only in "add new" mode — the type is already implied by which tab "+ Add
        // Service" was clicked from, so there's no need to also ask via a dropdown.
        // Editing still shows the dropdown, to allow recategorizing a service.
        defaultServiceType?: ServiceType;
        prices?: ServicePrice[];
        errorMessage?: string;
        onClose?: () => void;
    };

    const {
        service = null,
        defaultServiceType = ServiceType.FULL,
        prices = [],
        errorMessage,
        onClose
    }: Props = $props();

    const VEHICLE_CATEGORIES: VehicleCategory[] = ['coupe', 'sedan', 'van', 'suv', 'jeep', 'truck'];
    const CATEGORY_LABELS: Record<VehicleCategory, string> = {
        coupe: 'Coupe',
        sedan: 'Sedan',
        van: 'Van',
        suv: 'SUV',
        jeep: 'Jeep',
        truck: 'Truck'
    };

    function priceFor(category: VehicleCategory): number | '' {
        return prices.find(p => p.vehicleCategory === category)?.price ?? '';
    }

    let modalEl = $state<HTMLDivElement | null>(null);
    let submitting = $state(false);
    let cleanupWorseSelect: (() => void) | undefined;

    onMount(() => {
        modalEl?.focus();
        // Matches the pattern in scheduling/+page.svelte — worseSelect() styles the
        // native <select>, which stays the source of truth for value/form submission.
        // Scoped to modalEl rather than the whole document since this component mounts
        // and unmounts on its own; the returned cleanup avoids leaking its listeners.
        if (modalEl) cleanupWorseSelect = worseSelect(modalEl);
    });

    onDestroy(() => cleanupWorseSelect?.());

    function close() {
        onClose?.();
    }

    function handleBackdropClick(event: MouseEvent) {
        if (event.target === event.currentTarget) close();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.stopPropagation();
            close();
        }
    }

    function confirmDelete(event: MouseEvent) {
        if (!confirm(`Delete "${service?.name}"? This can't be undone.`)) {
            event.preventDefault();
        }
    }

    const handleEnhance: SubmitFunction = () => {
        submitting = true;
        return async ({result, update}) => {
            submitting = false;
            if (result.type === 'success') close();
            await update();
        };
    };
</script>

<svelte:window onkeydown={handleKeydown}/>

<div class="backdrop" onclick={handleBackdropClick} role="presentation">
    <div aria-labelledby="edit-service-title"
         aria-modal="true"
         bind:this={modalEl}
         class="modal"
         role="dialog"
         tabindex="0">
        <div class="header">
            <h2 id="edit-service-title">{service ? 'Edit service' : 'Add service'}</h2>

            <button aria-label="Close" class="icon-button" onclick={close} type="button">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <form method="POST" action="?/saveService" use:enhance={handleEnhance}>
            <div class="body">
                {#if service}<input name="id" type="hidden" value={service.id}/>{/if}

                {#if errorMessage}
                    <p class="error">{errorMessage}</p>
                {/if}

                <label class="field">
                    <span>Name</span>
                    <input name="name" required type="text" value={service?.name ?? ''}/>
                </label>

                <label class="field">
                    <span>Description</span>
                    <textarea name="description" required rows="3">{service?.description ?? ''}</textarea>
                </label>

                {#if service}
                    <label class="field">
                        <span>Type</span>
                        <select name="serviceType" required value={service.serviceType}>
                            {#each Object.values(ServiceType) as type}
                                <option value={type}>{type}</option>
                            {/each}
                        </select>
                    </label>
                {:else}
                    <div class="field">
                        <span>Type</span>
                        <p class="fixed-type">{defaultServiceType}</p>
                        <input name="serviceType" type="hidden" value={defaultServiceType}/>
                    </div>
                {/if}

                <fieldset class="price-group">
                    <legend>Price by vehicle type</legend>
                    <div class="price-grid">
                        {#each VEHICLE_CATEGORIES as category}
                            <label class="price-field">
                                <span>{CATEGORY_LABELS[category]}</span>
                                <input min="0" name="price_{category}" step="1" type="number" value={priceFor(category)}/>
                            </label>
                        {/each}
                    </div>
                </fieldset>
            </div>

            <div class="footer">
                {#if service}
                    <button class="danger" formaction="?/deleteService" onclick={confirmDelete} type="submit">
                        Delete
                    </button>
                {/if}

                <div class="footer-spacer"></div>

                <button class="secondary" onclick={close} type="button">Cancel</button>
                <button disabled={submitting} type="submit">
                    {service ? 'Save' : 'Add service'}
                </button>
            </div>
        </form>
    </div>
</div>

<style>
    .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: var(--overlay-backdrop);
        display: grid;
        place-items: center;
        padding: 1rem;
    }

    .modal {
        width: min(500px, 100%);
        max-height: min(85vh, 820px);
        background: var(--surface-overlay);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-dialog);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        outline: none;
    }

    form {
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    .header,
    .footer {
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .header {
        justify-content: space-between;
        border-bottom: 1px solid var(--overlay-border);
    }

    .footer {
        border-top: 1px solid var(--overlay-border);
        margin-top: auto;
    }

    .footer-spacer {
        flex: 1;
    }

    h2 {
        margin: 0;
        font-size: 1.125rem;
    }

    .body {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .error {
        margin: 0;
        padding: 0.6rem 0.75rem;
        border-radius: var(--border-radius);
        background: color-mix(in srgb, red 12%, var(--item-bg));
        color: inherit;
        font-size: 0.875rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        font-size: 0.875rem;
    }

    .field span {
        font-weight: 600;
    }

    .fixed-type {
        margin: 0;
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        background: var(--item-bg);
        color: var(--label-color);
    }

    .field input,
    .field textarea {
        font: inherit;
        padding: 0.5rem 0.6rem;
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        background: var(--item-bg);
        color: inherit;
    }

    /* worseSelect renders a styled companion UI next to the native <select> and keeps
       it as the source of truth for value/form submission — same pattern as
       scheduling/+page.svelte. */
    select {
        display: none;
    }

    .field textarea {
        resize: vertical;
    }

    .price-group {
        margin: 0;
        padding: 0;
        border: 0;
    }

    .price-group legend {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 700;
        padding: 0;
    }

    .price-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.6rem;
    }

    .price-field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        font-size: 0.8rem;
    }

    .price-field span {
        font-weight: 600;
    }

    .price-field input {
        font: inherit;
        padding: 0.4rem 0.5rem;
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        background: var(--item-bg);
        color: inherit;
    }

    .icon-button {
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        font: inherit;
        background: var(--surface-overlay);
        width: 2.25rem;
        height: 2.25rem;
        padding: 0;
        flex: 0 0 auto;
    }

    button.danger {
        background: transparent;
        border: 1px solid color-mix(in srgb, red 50%, var(--overlay-border));
        border-radius: var(--border-radius);
        padding: 0.5rem 1rem;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        color: color-mix(in srgb, red 70%, currentColor);
    }
</style>
