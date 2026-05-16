<script lang="ts">
    import type {Schema} from "../../../amplify/data/resource";

    type TimeSlot = {
        value: string;
        label: string;
        disabled: boolean;
    };

    type Props = {
        selectedDate: string | Date;
        businessStartTime: string;
        businessCloseTime: string;
        appointmentDurationHours: number;
        existingAppointments: Schema['Appointment']['createType'][];
        selectedTime?: string | null;
        onClose?: () => void;
        onConfirm?: (time: string | null) => void;
    };

    const {
        selectedDate,
        businessStartTime,
        businessCloseTime,
        appointmentDurationHours,
        existingAppointments,
        selectedTime = null,
        onClose,
        onConfirm
    }: Props = $props();

    const SLOT_MINUTES = 30;

    function toDate(value: string | Date): Date {
        return value instanceof Date ? value : new Date(value);
    }

    function ordinalSuffix(n: number): string {
        const v = n % 100;
        if (v >= 11 && v <= 13) return 'th';
        switch (n % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    function formatSelectedDate(value: string | Date): string {
        const date = toDate(value);
        if (Number.isNaN(date.getTime())) return 'Invalid date';
        const month = date.toLocaleString('en-US', { month: 'long' });
        const day = date.getDate();
        return `${month} ${day}${ordinalSuffix(day)}`;
    }

    function timeStringToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    function minutesToTimeString(totalMinutes: number): string {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function minutesToLabel(totalMinutes: number): string {
        const hours24 = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const suffix = hours24 >= 12 ? 'PM' : 'AM';
        const hours12 = hours24 % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, '0')} ${suffix}`;
    }

    function isSameLocalDay(a: Date, b: Date): boolean {
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    function getMinutesFromDate(date: Date): number {
        return date.getHours() * 60 + date.getMinutes();
    }

    function buildTimeSlots(): TimeSlot[] {
        const day = toDate(selectedDate);

        if (Number.isNaN(day.getTime())) return [];

        const businessOpenMinutes = timeStringToMinutes(businessStartTime);
        const businessCloseMinutes = timeStringToMinutes(businessCloseTime);
        const appointmentDurationMinutes = appointmentDurationHours * 60;

        const blockedHalfHours = new Set<number>();

        for (const appointment of existingAppointments) {
            const appointmentDate = toDate(appointment.date);

            if (Number.isNaN(appointmentDate.getTime())) continue;
            if (!isSameLocalDay(appointmentDate, day)) continue;

            const appointmentStartMinutes = getMinutesFromDate(appointmentDate);
            const appointmentEndMinutes =
                appointmentStartMinutes + appointmentDurationMinutes;

            for (
                let t = appointmentStartMinutes;
                t < appointmentEndMinutes;
                t += SLOT_MINUTES
            ) {
                blockedHalfHours.add(t);
            }
        }

        const slots: TimeSlot[] = [];

        for (
            let candidateStart = businessOpenMinutes;
            candidateStart <= businessCloseMinutes - SLOT_MINUTES;
            candidateStart += SLOT_MINUTES
        ) {
            const candidateEnd = candidateStart + appointmentDurationMinutes;
            let disabled = false;

            if (candidateEnd > businessCloseMinutes) {
                disabled = true;
            } else {
                for (let t = candidateStart; t < candidateEnd; t += SLOT_MINUTES) {
                    if (blockedHalfHours.has(t)) {
                        disabled = true;
                        break;
                    }
                }
            }

            slots.push({
                value: minutesToTimeString(candidateStart),
                label: minutesToLabel(candidateStart),
                disabled
            });
        }

        return slots;
    }

    const formattedDate = $derived(formatSelectedDate(selectedDate));
    const slots = $derived(buildTimeSlots());

    function closeModal() {
        onClose?.();
    }

    function selectSlot(slot: TimeSlot) {
        if (slot.disabled) return;
        onConfirm?.(slot.value);
    }

    function handleOverlayClick() {
        closeModal();
    }

    function handleWindowKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="time-modal-overlay" role="button" tabindex="0" onkeydown="{void(0)}" onclick={handleOverlayClick}>
    <div role="dialog"
         tabindex="0"
         onkeydown="{void(0)}"
         class="time-modal"
         aria-modal="true"
         aria-labelledby="time-modal-title"
         onclick={(event) => event.stopPropagation()}>

        <div class="time-modal__header">
            <div>
                <h2 id="time-modal-title" class="time-modal__title">Select a time</h2>
                <p class="time-modal__subtitle">{formattedDate}</p>
            </div>

            <button type="button"
                    class="time-modal__close icon-button"
                    style="border-color: var(--btn-border); color: var(--btn-border)"
                    aria-label="Close time picker"
                    onclick={closeModal}>
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="time-modal__body">
            {#if slots.length > 0}
                <div class="time-modal__rows">
                    {#each slots as slot (slot.value)}
                        <button type="button"
                                class="time-row"
                                class:selected={selectedTime === slot.value}
                                class:disabled={slot.disabled}
                                disabled={slot.disabled}
                                aria-pressed={selectedTime === slot.value}
                                onclick={() => selectSlot(slot)}>
                            <span class="time-row__label">{slot.label}</span>

                            {#if slot.disabled}
                                <span class="time-row__status">Unavailable</span>
                            {:else if selectedTime === slot.value}
                                <span class="time-row__status time-row__status--selected">Selected</span>
                            {/if}
                        </button>
                    {/each}
                </div>
            {:else}
                <div class="time-modal__empty">
                    No valid appointment times are available for this date.
                </div>
            {/if}
        </div>

        <div class="time-modal__footer"></div>
    </div>
</div>

<style>
    .time-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: var(--overlay-bg);
        backdrop-filter: blur(6px);
    }

    .time-modal {
        width: min(500px, 100%);
        max-height: min(70vh, 720px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border-radius: var(--border-radius);
        background: var(--modal-bg);
        border: 1px solid var(--modal-border);
        box-shadow: var(--shadow-modal);
    }

    .time-modal__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid var(--modal-border);
        background: var(--modal-bg);
    }

    .time-modal__title {
        margin: 0.25rem 0 0;
        font-size: 1.125rem;
        font-weight: 600;
    }

    .time-modal__subtitle {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        line-height: 1.5;
    }

    .time-modal__close {
        flex: 0 0 auto;
        width: 2.25rem;
        height: 2.25rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--btn-border);
        border-radius: var(--border-radius);
        background: var(--modal-bg);
        cursor: pointer;
        transition: all 160ms ease;
    }

    .time-modal__close:hover {
        background: var(--modal-item-bg);
        border-color: var(--btn-border);
    }

    .time-modal__body {
        padding: 1rem;
        overflow: auto;
    }

    .time-modal__rows {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .time-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.9rem;
        text-align: left;
        border: 1px solid var(--modal-border);
        border-radius: var(--border-radius);
        background: var(--modal-item-bg);
        cursor: pointer;
        transition:
                border-color 160ms ease,
                background 160ms ease,
                box-shadow 160ms ease;
    }

    .time-row:hover {
        border-color: var(--modal-border);
        background: var(--modal-item-bg-hover);
    }

    .time-row.selected {
        border-color: var(--btn-bg);
        background: var(--modal-item-bg-hover);
        box-shadow: var(--shadow-row-selected);
    }

    .time-row.disabled {
        cursor: not-allowed;
        border-color: var(--modal-border);
        box-shadow: none;
    }

    .time-row.disabled:hover {
        border-color: var(--modal-border);
        background: var(--modal-item-bg);
    }

    .time-row__label {
        font-size: 1rem;
        font-weight: 600;
    }

    .time-row__status {
        flex: 0 0 auto;
        font-size: 13px;
        font-weight: 700;
    }

    .time-modal__empty {
        padding: 20px;
        border: 1px dashed var(--modal-border);
        border-radius: var(--border-radius);
        background: var(--modal-item-bg);
        font-size: 14px;
        line-height: 1.6;
    }

    .time-modal__footer {
        padding: 0.5rem;
        border-top: 1px solid var(--modal-border);
        background: var(--modal-bg);
    }

    @media (max-width: 640px) {
        .time-modal-overlay {
            padding: 0;
            align-items: flex-end;
        }

        .time-modal {
            width: 100%;
            max-height: 74vh;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }

        .time-modal__footer {
            flex-direction: column;
            align-items: stretch;
        }
    }
</style>