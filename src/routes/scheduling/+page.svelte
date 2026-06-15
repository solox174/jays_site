<script lang="ts">
    import {onMount, tick} from 'svelte';
    import {nhtsaApi, type VehicleCategory} from '$lib/api/nhtsaApi';
    import AirDatepicker from 'air-datepicker';
    import {worseSelect} from 'worse-select';
    import localeEn from 'air-datepicker/locale/en';
    import type {Appointment, Service, ServicePrice} from '$lib/server/repository/types';
    import TimePickerModal from '$lib/component/TimePickerModal.svelte';
    import {enhance} from '$app/forms';
    import type {SubmitFunction} from '@sveltejs/kit';

    import 'air-datepicker/air-datepicker.css';
    import type {PageProps} from './$types';
    import {isBusy} from '$lib/stores/ui.svelte';
    import ServiceModal from "$lib/component/ServiceModal.svelte";

    let {data, form}: PageProps = $props();
    // data is server-loaded and won't change reactively — safe to initialize state from it
    // svelte-ignore state_referenced_locally
    let services = $state(data.services as Service[]);
    // svelte-ignore state_referenced_locally
    let appointments = $state(data.appointments as Appointment[]);
    // svelte-ignore state_referenced_locally
    let servicePrices = $state(data.servicePrices as ServicePrice[]);
    let selectedServiceSummary = $derived(
        services.length ? services
            .filter((service) => selectedServiceIds.includes(service.id ?? ''))
            .map((service) => service.name)
            .join(', ') : ''
    );

    let selectedMake = $state('');
    let selectedModel = $state('');
    let selectedYear = $state('');
    let selectedServiceIds = $state<(string | undefined)[]>([]);
    let appointmentDateString = $state('');
    let selectedTime = $state('');
    let displayDate = $derived((() => {
        if (!appointmentDateString) return '';
        const date = new Date(appointmentDateString);
        const month = date.toLocaleString('en-US', {month: 'short'});
        const day = date.getDate();
        const v = day % 100;
        const suffix = (v >= 11 && v <= 13) ? 'th' : (['th', 'st', 'nd', 'rd'][day % 10] ?? 'th');
        const dateStr = `${month} ${day}${suffix}`;
        if (!selectedTime) return dateStr;
        const [h, m] = selectedTime.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        const timeStr = m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`;
        return `${dateStr}, ${timeStr}`;
    })());

    let makes = $state<string[]>([]);
    let models = $state<string[]>([]);
    let bodyClass = $state<VehicleCategory | null>(null);
    let bodyClassLoading = $state(false);
    let safetyKey = $derived(selectedYear && selectedMake && selectedModel ? `${selectedYear}|${selectedMake}|${selectedModel}` : '');
    let priceMap = $derived(
        bodyClass
            ? new Map(
                servicePrices
                    .filter(sp => sp.vehicleCategory === bodyClass)
                    .map(sp => [sp.serviceId, sp.price] as [string, number])
            )
            : undefined
    );
    let selectedServicesSummary = $derived(
        services
            .filter(s => selectedServiceIds.includes(s.id ?? ''))
            .map(s => ({name: s.name, price: priceMap?.get(s.id ?? '')}))
    );
    let totalPrice = $derived(
        selectedServiceIds.reduce((sum, id) => sum + (priceMap?.get(id ?? '') ?? 0), 0)
    );

    function formatPrice(price: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(price);
    }

    $effect(() => {
        if (!safetyKey) {
            bodyClass = null;
            bodyClassLoading = false;
            return;
        }
        bodyClassLoading = true;
        (async () => {
            bodyClass = await nhtsaApi.getBodyClass(selectedMake, selectedModel, selectedYear);
            bodyClassLoading = false;
        })();
    });
    const currentYear = new Date().getFullYear();
    let years = Array.from({length: 35}, (_, index) => String(currentYear - index));

    let submitHint = $derived(
        !selectedModel ? 'Select a vehicle to continue' :
        selectedServiceIds.length === 0 ? 'Select a service to continue' :
        !appointmentDateString ? 'Select a date to continue' :
        !selectedTime ? 'Select a time to continue' : ''
    );

    let isServiceModalOpen = $state(false);
    let showTimePicker = $state(false);
    let confirmed = $state(false);
    let confirmedDate = $state('');
    let warningActive = $state(false);

    async function triggerWarning() {
        if (warningActive) {
            warningActive = false;
            await tick();
        }
        warningActive = true;
    }

    onMount(() => {
        worseSelect();
        fetch('/vehicle-data/makes.json').then(r => r.json()).then(d => makes = d);

        const BUSINESS_DAY_CAPACITY = 8;
        const appointmentCounts = new Map<string, number>();
        for (const appointment of appointments) {
            const localDate = new Date(appointment.date);
            const localDateYMD = `${localDate.getFullYear()}${localDate.getMonth()}${localDate.getDate()}`;
            const count = appointmentCounts.get(localDateYMD) ?? 0;
            appointmentCounts.set(localDateYMD, count + 1);
        }

        new AirDatepicker('#calendar', {
            locale: (localeEn as any).default ?? localeEn,

            onRenderCell({date, cellType}) {
                if (cellType == 'day' && appointments) {
                    const calendarYMD = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
                    const appointmentCount = appointmentCounts.get(calendarYMD);
                    const isDisabled = appointmentCount == BUSINESS_DAY_CAPACITY || date < new Date(Date.now());

                    return {
                        disabled: isDisabled
                    }
                }
            },
            onSelect({date, datepicker}) {
                if (date instanceof Date) {
                    showTimePicker = true;
                    appointmentDateString = date.toISOString();
                    datepicker.hide();
                }
            }
        });
    });

    function makeToFilename(make: string): string {
        return make.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    function handleYearChange() {
        selectedMake = '';
        selectedModel = '';
        models = [];
    }

    async function handleMakeChange() {
        selectedModel = '';
        models = [];

        if (!selectedMake) return;

        try {
            const res = await fetch(`/vehicle-data/models/${makeToFilename(selectedMake)}.json`);
            models = await res.json();
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Failed to load vehicle models.');
        }
    }

    function openServiceModal() {
        if (!isBusy.state && selectedModel) {
            isServiceModalOpen = true;
        }
    }

    function closeServiceModal() {
        isServiceModalOpen = false;
    }

    function handleServicesSave(detail: { ids: (string | undefined)[] }) {
        selectedServiceIds = [...detail.ids];
        isServiceModalOpen = false;
    }

    const handleEnhance: SubmitFunction = () => {
        isBusy.state = true;
        return async ({result, update}) => {
            if (result.type === 'success') {
                confirmedDate = displayDate;
                selectedYear = '';
                selectedMake = '';
                selectedModel = '';
                selectedServiceIds = [];
                appointmentDateString = '';
                selectedTime = '';
                models = [];
                confirmed = true;
            }
            isBusy.state = false;
            await update();
        };
    };

    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && isServiceModalOpen) {
            closeServiceModal();
        }
    }
</script>

<svelte:window onkeydown={handleWindowKeydown}/>

<svelte:head>
    <title>Schedule</title>
</svelte:head>

{#if confirmed}
    <div class="glass-panel">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px 0;">
            <p style="font-size: 1.1rem;">Your appointment is confirmed for <strong>{confirmedDate}</strong>.</p>
            <p style="font-size: 0.85rem; opacity: 0.7;">We'll see you then — you'll receive a confirmation email shortly.</p>
        </div>
    </div>
{/if}

{#if !confirmed}
<form method="POST" use:enhance={handleEnhance}>
    <div class="glass-panel">
        <div style="display: flex; flex-direction: column">
            <div class="section-title">Vehicle</div>
            <fieldset class="form-section scheduling-section">
                <div class="dropdown">
                    <label for="year">Year</label>
                    <select bind:value={selectedYear} id="year" name="year" onchange={handleYearChange}
                            style="background:red">
                        <option value="">select year</option>
                        {#each years as year}
                            <option value={year}>{year}</option>
                        {/each}
                    </select>
                </div>

                <div class="dropdown">
                    <label for="make">Make</label>
                    <select bind:value={selectedMake}
                            id="make"
                            name="make"
                            onchange={handleMakeChange}>
                        <option value="">
                            select make
                        </option>
                        {#each makes as make}
                            <option value={make}>{make}</option>
                        {/each}
                    </select>
                </div>

                <div class="dropdown">
                    <label for="model">Model</label>
                    <select bind:value={selectedModel}
                            id="model"
                            name="model">
                        <option value="">
                            select model
                        </option>
                        {#each models as model}
                            <option value={model}>{model}</option>
                        {/each}
                    </select>
                </div>
            </fieldset>

            <div class="section-title" style="margin-top: 40px;">Services & Date</div>
            <fieldset class="form-section scheduling-section">
                <div class="dropdown">
                    <label for="service">Services</label>
                    <span style="position: relative; display: inline-block;">
                        <input autocomplete="off"
                               disabled={!selectedModel}
                               id="service"
                               onclick={openServiceModal}
                               placeholder="select service"
                               readonly
                               style="width:150px; text-align: {selectedServiceSummary ? 'left' : 'center'}"
                               type="text"
                               value={selectedServiceSummary}/>
                        {#if !selectedModel}
                            <span style="position: absolute; inset: 0; cursor: not-allowed;"
                                  onclick={triggerWarning}
                                  aria-hidden="true"></span>
                        {/if}
                    </span>
                </div>

                <div class="dropdown">
                    <label for="calendar">Date</label>
                    <span style="position: relative; display: inline-block;">
                        <i class="fa-regular fa-calendar"></i>
                        <input autocomplete="off"
                               id="calendar"
                               placeholder="select date"
                               style="width: 110px; padding-right: 1.75rem !important;"
                               type="text"
                               value={displayDate} />
                    </span>
                </div>
            </fieldset>

            {#if selectedServicesSummary.length > 0 && priceMap}
                <div class="order-summary">
                    {#each selectedServicesSummary as item}
                        <div class="summary-row">
                            <span>{item.name}</span>
                            <span>{item.price != null ? formatPrice(item.price) : '—'}</span>
                        </div>
                    {/each}
                    <div class="summary-row summary-total">
                        <span>Estimated total</span>
                        <strong>{formatPrice(totalPrice)}</strong>
                    </div>
                </div>
            {:else if safetyKey && !bodyClassLoading && !bodyClass}
                <!-- TODO: when sending email to owner, must specify owner needs to contact customer -->
                <div style="padding: 10px 0 4px; font-size: 0.85rem; opacity: 0.7">
                    Special vehicle type — we'll follow up with pricing after you book.
                </div>
            {/if}

            <input type="hidden" name="date" value={appointmentDateString} />
            <input type="hidden" name="time" value={selectedTime} />
            {#each selectedServiceIds as id}
                {#if id}<input type="hidden" name="serviceId" value={id} />{/if}
            {/each}

            {#if form?.message}
                <p style="color: red; text-align: center; margin: 8px 0 0; font-size: 0.85rem;">{form.message}</p>
            {/if}

            <span style="position: relative; display: inline-block; align-self: center; margin-top: 5px;">
                <button disabled={!!submitHint}>
                    Schedule Appointment
                </button>
                {#if submitHint}
                    <span style="position: absolute; inset: 0; cursor: not-allowed;"
                          onclick={triggerWarning}
                          aria-hidden="true"></span>
                {/if}
            </span>
            {#if submitHint}
            <div id="next-hint">
                <i class="fa-solid fa-triangle-exclamation warn-icon"
                   class:warn-active={warningActive}
                   onanimationend={() => warningActive = false}></i>
                <span style="font-size: .9rem; margin:0; font-style: italic">{submitHint}</span>
            </div>
            {/if}
        </div>
    </div>
</form>

{/if}

{#if isServiceModalOpen}
    <ServiceModal
            {services}
            {priceMap}
            selectedIds={selectedServiceIds}
            onSave={handleServicesSave}
            onClose={closeServiceModal}
    />
{/if}

{#if showTimePicker}
    <TimePickerModal
            selectedDate={appointmentDateString}
            businessStartTime={'09:00'}
            businessCloseTime={'17:00'}
            appointmentDurationHours={2}
            existingAppointments={appointments}
            selectedTime={selectedTime}
            onClose={() => (showTimePicker = false)}
            onConfirm={(time) => { selectedTime = time ?? ''; showTimePicker = false; }}
    />
{/if}

<style>
    select {
        display: none;
    }

    #next-hint {
        display: flex;
        align-items: center;
        margin-top:10px;
        padding: 3px 10px;
        color: white;
        flex-grow: 0;
        flex-shrink:1;
        flex-basis: auto;
        align-self: center;
    }

    .form-section {
        border: none;
        padding: 0 0 24px 0;
        margin: 0;
        min-inline-size: 0;
    }

    .dropdown {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    @media (max-width: 640px) {
        .dropdown {
            position: relative;
        }

        .dropdown label {
            position: absolute;
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            padding-right: 8px;
        }

        #service, #calendar {
            flex: none;
        }
    }

    select {
        width: 120px;
    }

    #service {
        width: 170px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    #service:disabled {
        cursor: not-allowed;
    }

    label {
        margin-right: 5px;
    }

    input {
        font-size: .8rem !important;
        text-align: center;
        height: 16px;
    }

    .order-summary {
        margin-top: 8px;
        font-size: 0.85rem;
        border-top: 1px solid var(--overlay-border, rgba(255, 255, 255, 0.15));
        padding-top: 8px;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
        opacity: 0.8;
    }

    .summary-total {
        border-top: 1px solid var(--overlay-border, rgba(255, 255, 255, 0.15));
        margin-top: 4px;
        padding-top: 6px;
        opacity: 1;
        font-size: 0.9rem;
    }

    @keyframes warn-flash {
        0%   { opacity: 0; transform: scale(0.3); }
        20%  { opacity: 1; transform: scale(1.3); }
        40%  { opacity: 1; transform: scale(1.0); }
        100% { opacity: 0; }
    }

    .warn-icon {
        display: inline-block;
        max-width: 0;
        overflow: hidden;
        margin-right: 0;
        opacity: 0;
        color: var(--label-color);
        transition: max-width 0.25s ease, margin-right 0.25s ease;
    }

    .warn-icon.warn-active {
        max-width: 1.5em;
        margin-right: 5px;
        animation: warn-flash 1.8s ease forwards;
        transition: none;
    }

    .fa-calendar {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        padding: 0 0.4rem;
        color: var(--control-border);
        border-left: 1px solid var(--control-border);
        pointer-events: none;
        font-size: .9rem;
    }
</style>