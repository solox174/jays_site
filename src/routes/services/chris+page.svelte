<script lang="ts">
    import {onMount} from 'svelte';
    import {ServiceType} from '$lib/types';
    import type {Service} from "$lib/server/repository/types";

    let {data} = $props();
    const services = data.services;

    const serviceTypes = Object.values(ServiceType);

    onMount(() => {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const container = button.closest('.tab-container');
                const targetPanelId = button.getAttribute('aria-controls');

                // 1. Remove active states from all buttons in this container
                container!.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                    btn.setAttribute('tabindex', '-1');
                });

                // 2. Hide all panels in this container
                container!.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                    panel.setAttribute('hidden', 'true');
                });

                // 3. Activate the clicked button
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');
                button.removeAttribute('tabindex');

                // 4. Show the corresponding panel
                const targetPanel = container!.querySelector(`#${targetPanelId}`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                    targetPanel.removeAttribute('hidden');
                }
            });
        });
    });
</script>

<div class="glass-panel">
    <div class="tab-container">
        <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
        <nav class="tab-nav" role="tablist" aria-label="Service Tabs" style="display: flex">
            {#each serviceTypes as serviceType, index}
                <button class="tab-button {index === 0 ? 'active' : ''}" role="tab" aria-selected="true" aria-controls="panel-{index}" id="tab-{index}">
                    {serviceType}
                </button>
                {#if serviceTypes.length-1 !== index}
                    <div style="width: 5px"></div>
                {/if}
            {/each}
            <div style="flex-grow: 1"></div>
        </nav>

        <div class="tab-content">
            {#each serviceTypes as serviceType, index}
                <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                {#each services.filter((service: Service) => service.serviceType === serviceType) as service}
                <section class="tab-panel {index === 0 ? 'active' : ''}" id="panel-{index}" role="tabpanel" aria-labelledby="tab-{index}">
                    <div>{service.name}</div>
                    <div>{service.description}</div>
                </section>
                {/each}
            {/each}
        </div>
    </div>
</div>

<style>
    :root {
        --tab-border-color: color-mix(in srgb, var(--action-text-disabled) 60%, #000);
    }
    :root[data-theme="dark"] {
        --tab-border-color: color-mix(in srgb, var(--action-text-disabled) 60%, #fff);
    }
    /* Base Container */
    .tab-container {
        width: 100%;
        max-width: 600px;
        margin: 20px auto;
    }

    /* Tab Navigation Bar */
    .tab-nav {
        display: flex;
    }

    .tab-nav > * {
        border-bottom: 2px solid var(--brand-color)!important;
    }
    /* Individual Tab Buttons */
    .tab-button {
        color: rgb(0 0 0 / 30%)!important;
        padding: 10px 20px;
        border: 1px solid var(--tab-border-color)!important;
        font-weight: 600;
        border-radius: 4px 4px 0 0;
        transition: all 0.2s ease;
        background-color: rgb(0 0 0 / 5%)!important;
        border-bottom: 2px solid var(--brand-color)!important;
    }

    .tab-button:hover {
        background-color: rgb(0 0 0 / 10%)!important;
    }

    /* Active Tab State */
    .tab-button.active {
        background-color: transparent!important;
        color: black!important;
        border: 2px solid var(--brand-color)!important;
        border-bottom: none!important;
        box-shadow: none!important;
    }

    :root[data-theme="dark"] {
        .tab-button {
            color: rgb(255 255 255 / 30%) !important;
            background-color: rgb(255 255 255 / 5%)!important;
        }
        .tab-button.active {
            background-color: transparent!important;
            color: white!important;
        }
        .tab-button:hover {
            background-color: rgb(255 255 255 / 10%)!important;
        }
    }

    /* Content Panel Wrapper */
    .tab-content {
        border-top: none;
        padding: 20px;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
    }

    /* Panel Visibility Rules */
    .tab-panel {
        display: none;
    }

    .tab-panel.active {
        display: block;
    }
</style>