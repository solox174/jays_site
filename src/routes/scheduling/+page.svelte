<script lang="ts">
    import { onMount } from 'svelte';
    import { nhtsaApi } from '$lib/api/nhtsaApi';
    import type { Schema } from '$lib/../../amplify/data/resource';
    import AirDatepicker from 'air-datepicker';
    import { worseSelect } from 'worse-select';
    import localeEn from 'air-datepicker/locale/en';
    import ServiceModal from '$lib/component/ServiceModal.svelte';
    import TimePickerModal from '$lib/component/TimePickerModal.svelte';

    import 'air-datepicker/air-datepicker.css';
    import { amplifyClient } from '$lib/api/amplifyClient';
    import type { PageProps } from './$types';
    import { isBusy } from '$lib/stores/ui';

    $isBusy = true;
    let { data }: PageProps = $props();
    let services = $state<Schema['Service']['createType'][]>([]);
    let appointments = $state<Schema['Appointment']['createType'][]>([]);
    let selectedServiceSummary = $derived(
        services
            .filter((service) => selectedServiceIds.includes(service.id ?? ''))
            .map((service) => service.name)
            .join(', ')
    );

    // TODO: get from session
    let customerId = $state('');
    let vehicleId = $state('');

    let selectedMake = $state('');
    let selectedModel = $state('');
    let selectedYear = $state('');
    let selectedServiceIds = $state<(string | undefined)[]>([]);
    let appointmentDateString = $state('');

    let makes = $state<string[]>([]);
    let models = $state<string[]>([]);
    const currentYear = new Date().getFullYear();
    let years = Array.from({ length: 35 }, (_, index) => String(currentYear - index));

    let isServiceModalOpen = $state(false);
    let showTimePicker = $state(false);
    let selectedTime = $state('');

    onMount(async () => {
        worseSelect();
        const BUSINESS_DAY_CAPACITY = 8;
        const appointmentCounts = new Map<string, number>();
        await data.deferred.data.then((data) => {
            services = data.services;
            appointments = data.appointments;
            $isBusy = false;
        });
        for (const appointment of appointments) {
            const localDate = new Date(appointment.date);
            const localDateYMD = `${localDate.getFullYear()}${localDate.getMonth()}${localDate.getDate()}`;
            const count = appointmentCounts.get(localDateYMD) ?? 0;
            appointmentCounts.set(localDateYMD, count + 1);
        }

        new AirDatepicker('#calendar', {
            locale: localeEn,

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
            onSelect({ date, formattedDate, datepicker }) {
                if (date instanceof Date) {
                    showTimePicker = true;
                    appointmentDateString = date.toISOString();
                }
            }
        });
    });

    async function handleYearChange() {
        selectedMake = '';
        selectedModel = '';
        makes = [];
        models = [];

        if (!selectedYear) return;

        try {
            $isBusy = true;
            makes = await nhtsaApi.getMakeOptions();
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Failed to load vehicle makes.');
        } finally {
            $isBusy = false;
        }
    }

    async function handleMakeChange() {
        selectedModel = '';
        models = [];

        if (!selectedYear || !selectedMake) return;

        try {
            $isBusy = true;
            models = await nhtsaApi.getModelOptions(selectedMake, selectedYear);
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Failed to load vehicle models.');
        } finally {
            $isBusy = false;
        }
    }

    async function ensureVehicle(): Promise<string> {
        if (!selectedYear || !selectedMake || !selectedModel) {
            throw new Error('Year, make, and model are required.');
        }

        const { data: existingVehicleSpecs, errors } = await amplifyClient.models.VehicleSpec.list({
            filter: {
                and: [
                    { year: { eq: selectedYear } },
                    { make: { eq: selectedMake } },
                    { model: { eq: selectedModel } }
                ]
            }
        });

        if (errors?.length) {
            throw new Error(errors.map((error) => error.message).join(', '));
        }

        if (existingVehicleSpecs.length > 0) {
            return existingVehicleSpecs[0].id;
        }

        const { data: vehicleSpecModel, errors: createErrors } = await amplifyClient.models.VehicleSpec.create({
            year: selectedYear,
            make: selectedMake,
            model: selectedModel
        });

        if (createErrors?.length || !vehicleSpecModel?.id) {
            throw new Error(
                createErrors?.map((error) => error.message).join(', ') || 'Failed to create vehicle.'
            );
        }

        return vehicleSpecModel.id;
    }

    function openServiceModal() {
        if (!$isBusy) {
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

    async function handleSubmit(event: SubmitEvent) {
        event.preventDefault();
        $isBusy = true;

        try {
            if (selectedServiceIds.length === 0) {
                throw new Error('Please select at least one service.');
            }

            vehicleId = await ensureVehicle();

            // BEGIN: fake customer until account creation is created
            const customer: Schema['Customer']['createType'] = {
                email: "real@email.later",
                firstName: "Joe",
                lastName: "Smith",
                phoneNumber: "+12672310897",
                password: "xxxxxxx"
            }
            const { data: customerModel }= await amplifyClient.models.Customer.create(customer);
            const customerId = customerModel?.id;

            if (!customerId) throw new Error('Customer creation failed');
            // END: fake customer
            const appointmentDate = new Date(appointmentDateString);
            const [hour, minutes] = selectedTime.split(':');
            appointmentDate.setHours(Number.parseInt(hour));
            appointmentDate.setMinutes(Number.parseInt(minutes));

            const appointment: Schema['Appointment']['createType'] = {
                customerId,
                vehicleId,
                date: appointmentDate.toISOString()
            };

            // Amplify's generated types allow `id` to be undefined on create/read model
            // objects, even though these objects will always have an id at runtime. These
            // null checks on id's exist to satisfy TypeScript, even though they will never trigger.
            const { data: appointmentModel, errors } = await amplifyClient.models.Appointment.create(appointment);

            if (errors?.length) throw new Error('Appointment creation failed');

            const appointmentId = appointmentModel?.id;
            if (!appointmentId) throw new Error('Appointment id missing after creation');

            const appointmentServices: Schema['AppointmentService']['createType'][] = selectedServiceIds.map((serviceId) => {
                if (!serviceId) throw new Error('Service id missing');
                return { appointmentId, serviceId };
            });
            // TODO: Promise.allSettled() with "rollback"
            await Promise.all(
                appointmentServices.map(service => {
                    return amplifyClient.models.AppointmentService.create(service)
                })
            );

            vehicleId = '';
            selectedYear = '';
            selectedMake = '';
            selectedModel = '';
            selectedServiceIds = [];
            appointmentDateString = '';
            selectedTime = '';
            makes = [];
            models = [];
        } catch (error) {
            console.error(error instanceof Error ? error.message : 'Failed to create appointment.');
        } finally {
            $isBusy = false;
        }
    }

    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && isServiceModalOpen) {
            closeServiceModal();
        }
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<svelte:head>
    <title>Schedule</title>
    <meta name="description" content="Svelte demo app" />
</svelte:head>

<form onsubmit={handleSubmit}>
    <div style="background: var(--glass-color); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: var(--border-radius); margin: 0 auto; width: min(550px, 100%); padding: 24px; box-sizing: border-box">
    <div style="display: flex; flex-direction: column; margin: 0 auto; width: min(550px, 100%)">
        <legend class="section-title">Vehicle</legend>
        <fieldset class="form-section scheduling-section">
            <div class="dropdown">
                <label for="year">Year</label>
                <select id="year" name="year" bind:value={selectedYear} onchange={handleYearChange}>
                    <option value="">Select year</option>
                    {#each years as year}
                        <option value={year}>{year}</option>
                    {/each}
                </select>
            </div>

            <div class="dropdown">
                <label for="make">Make</label>
                <select id="make"
                        name="make"
                        bind:value={selectedMake}
                        onchange={handleMakeChange}
                        disabled={!selectedYear} >
                    <option value="">
                        Select make
                    </option>
                    {#each makes as make}
                        <option value={make}>{make}</option>
                    {/each}
                </select>
            </div>

            <div class="dropdown">
                <label for="model">Model</label>
                <select id="model"
                        name="model"
                        bind:value={selectedModel}
                        disabled={!selectedMake}>
                    <option value="">
                        Select model
                    </option>
                    {#each models as model}
                        <option value={model}>{model}</option>
                    {/each}
                </select>
            </div>
        </fieldset>

        <legend class="section-title" style="margin-top: 40px;">Services & Date</legend>
        <fieldset class="form-section scheduling-section">
            <div class="dropdown">
                <label for="service">Services</label>
                <input id="service"
                       type="text"
                       style="width:170px"
                       readonly
                       value={selectedServiceSummary}
                       onclick={openServiceModal} />
            </div>

            {#if isServiceModalOpen}
            <ServiceModal
                    {services}
                    selectedIds={selectedServiceIds}
                    onSave={handleServicesSave}
                    onClose={closeServiceModal}
            />
            {/if}

            <div class="dropdown">
                <label for="calendar">Date</label>
                <input
                        id="calendar"
                        bind:value={appointmentDateString}
                        autocomplete="one-time-code"
                        type="text"
                        style="width: 62px; font-size: .8rem"
                />
            </div>
            {#if showTimePicker}
            <TimePickerModal
                    selectedDate={appointmentDateString}
                    businessStartTime={'09:00'}
                    businessCloseTime={'17:00'}
                    appointmentDurationHours={2}
                    existingAppointments={appointments}
                    selectedTime={selectedTime}
                    onClose={() => (showTimePicker = false)}
                    onSelect={(time) => (selectedTime = time)}
                    onConfirm={(time) => { selectedTime = time ?? ''; showTimePicker = false; }}
            />
            {/if}
        </fieldset>

        <button class="schedule-button" disabled={!selectedTime || !appointmentDateString || !selectedModel} style="color: black; display: flex; align-items: center; justify-content: center; align-self: center; padding: 3px; border: 1px solid black; margin-top: 1.5rem">
            <i class="fa-solid fa-calendar-plus" style="font-size: 1.5rem; color: var(--brand-color)"></i>
            <span id="submit-label" style="text-decoration: underline; font-weight: bold; margin-right: 10px">Schedule Appointment</span>
        </button>
    </div>
    </div>
</form>

<style>
    select {
        display: none;
    }

    .form-section {
        border: none;
        padding: 0 0 24px 0;
        margin: 0;
        min-inline-size: 0;
    }

    .form-section + .form-section {
        padding-top: 8px;
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
            white-space: nowrap;
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

    #service, #calendar {
        cursor: pointer;
        text-align: center;
        flex: 1;
        width: 100px;
    }

    label {
        text-align: center;
        margin-right: 5px;
    }

    .schedule-button:disabled {
        background: #e5e7eb;
        color: #6b7280;
        border-color: #9ca3af;
        opacity: 0.72;
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
    }

    #submit-label {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
</style>