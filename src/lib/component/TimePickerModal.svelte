<script lang="ts">
    import type {Appointment} from "$lib/types/UITypes";

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
        existingAppointments: Appointment[];
        selectedTime?: string | null;
        onClose?: () => void;
        onSelect?: (time: string) => void;
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
        onSelect,
        onConfirm
    }: Props = $props();

    const SLOT_MINUTES = 30;

    function toDate(value: string | Date): Date {
        return value instanceof Date ? value : new Date(value);
    }

    function formatSelectedDate(value: string | Date): string {
        const date = toDate(value);

        if (Number.isNaN(date.getTime())) return 'Invalid date';

        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        }).format(date);
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
        onSelect?.(slot.value);
    }

    function confirmSelection() {
        if (!selectedTime) return;
        onConfirm?.(selectedTime);
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
    <div
            role="dialog"
            tabindex="0"
            onkeydown="{void(0)}"
            class="time-modal"
            aria-modal="true"
            aria-labelledby="time-modal-title"
            onclick={(event) => event.stopPropagation()}
    >
        <div class="time-modal__header">
            <div>
                <div style="display: flex; align-items: center; margin-bottom: 10px">
                    <span class="time-modal__eyebrow">Appointment time</span>
                    <span style="margin-left: 5px; font-size: 1rem">{formattedDate}</span>
                </div>
                <h2 id="time-modal-title" class="time-modal__title">Select a time</h2>
            </div>

            <button
                    type="button"
                    class="time-modal__close"
                    aria-label="Close time picker"
                    onclick={closeModal}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                            d="M18 6 6 18M6 6l12 12"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                    />
                </svg>
            </button>
        </div>

        <div class="time-modal__body">
            {#if slots.length > 0}
                <div class="time-modal__rows">
                    {#each slots as slot (slot.value)}
                        <button
                                type="button"
                                class="time-row"
                                class:selected={selectedTime === slot.value}
                                class:disabled={slot.disabled}
                                disabled={slot.disabled}
                                aria-pressed={selectedTime === slot.value}
                                onclick={() => selectSlot(slot)}
                        >
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

        <div class="time-modal__footer">
            <div class="time-modal__actions">
                <button type="button" class="btn btn--secondary" onclick={closeModal}>
                    Cancel
                </button>

                <button
                        type="button"
                        class="btn btn--primary"
                        disabled={!selectedTime}
                        onclick={confirmSelection}
                >
                    Continue
                </button>
            </div>
        </div>
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
        background: var(--color-overlay-background);
        backdrop-filter: blur(6px);
    }

    .time-modal {
        width: min(720px, 100%);
        max-height: min(88vh, 900px);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        border-radius: var(--border-radius);
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 24px 64px rgba(15, 23, 42, 0.16);
    }

    .time-modal__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 24px 24px 18px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
    }

    .time-modal__eyebrow {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 12px;
        border-radius: var(--border-radius);
        background: #f3f4f6;
        color: #4b5563;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .time-modal__title {
        margin: 0;
        color: #111827;
        font-size: 28px;
        line-height: 1.1;
        font-weight: 800;
        letter-spacing: -0.02em;
    }

    .time-modal__subtitle {
        margin: 10px 0 0;
        color: #6b7280;
        font-size: 15px;
        line-height: 1.5;
    }

    .time-modal__close {
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e5e7eb;
        border-radius: var(--border-radius);
        background: #ffffff;
        color: #6b7280;
        cursor: pointer;
        transition: all 160ms ease;
    }

    .time-modal__close:hover {
        color: #111827;
        background: #f9fafb;
        border-color: #d1d5db;
    }

    .time-modal__close svg {
        width: 18px;
        height: 18px;
    }

    .time-modal__body {
        padding: 20px 24px 24px;
        overflow: auto;
    }

    .time-modal__summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 18px;
        padding: 14px 16px;
        border: 1px solid #e5e7eb;
        border-radius: var(--border-radius);
        background: #fafafa;
    }

    .time-modal__summary-label {
        color: #6b7280;
        font-size: 13px;
        font-weight: 700;
    }

    .time-modal__summary-value {
        color: #111827;
        font-size: 16px;
        font-weight: 800;
    }

    .time-modal__rows {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .time-row {
        width: 100%;
        min-height: 68px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 18px;
        text-align: left;
        border: 1px solid #e5e7eb;
        border-radius: var(--border-radius);
        background: #ffffff;
        color: #111827;
        cursor: pointer;
        transition:
                border-color 160ms ease,
                background 160ms ease,
                box-shadow 160ms ease,
                transform 160ms ease;
    }

    .time-row:hover {
        transform: translateY(-1px);
        border-color: #d1d5db;
        background: #fcfcfc;
        box-shadow: 0 10px 24px rgba(17, 24, 39, 0.05);
    }

    .time-row.selected {
        border-color: #111827;
        background: #f9fafb;
        box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.06);
    }

    .time-row.disabled {
        cursor: not-allowed;
        background: #f9fafb;
        color: #9ca3af;
        border-color: #eceff3;
        box-shadow: none;
    }

    .time-row.disabled:hover {
        transform: none;
        background: #f9fafb;
        border-color: #eceff3;
    }

    .time-row__label {
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.01em;
    }

    .time-row__status {
        flex: 0 0 auto;
        color: #9ca3af;
        font-size: 13px;
        font-weight: 700;
    }

    .time-row__status--selected {
        color: #111827;
    }

    .time-modal__empty {
        padding: 20px;
        border: 1px dashed #d1d5db;
        border-radius: var(--border-radius);
        background: #fafafa;
        color: #6b7280;
        font-size: 14px;
        line-height: 1.6;
    }

    .time-modal__footer {
        display: flex;
        align-items: center;;
        justify-content: end;
        --gap: 16px;
        padding: 18px 24px 24px;
        border-top: 1px solid #e5e7eb;
        background: #ffffff;
    }

    .time-modal__selection-label {
        color: #6b7280;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .time-modal__selection-value {
        margin-top: 4px;
        color: #111827;
        font-size: 16px;
        font-weight: 700;
    }

    .btn {
        min-width: 120px;
        height: 46px;
        padding: 0 18px;
        border-radius: var(--border-radius);
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition:
                transform 160ms ease,
                background 160ms ease,
                border-color 160ms ease,
                color 160ms ease,
                opacity 160ms ease;
    }

    .btn:hover {
        transform: translateY(-1px);
    }

    .btn--secondary {
        border: 1px solid #e5e7eb;
        background: #ffffff;
        color: #111827;
    }

    .btn--secondary:hover {
        border-color: #d1d5db;
        background: #f9fafb;
    }

    .btn--primary {
        border: 1px solid #111827;
        background: #111827;
        color: #ffffff;
    }

    .btn--primary:hover {
        background: #000000;
        border-color: #000000;
    }

    .btn--primary:disabled {
        opacity: 0.45;
        cursor: not-allowed;
        transform: none;
    }

    @media (max-width: 640px) {
        .time-modal-overlay {
            padding: 0;
            align-items: flex-end;
        }

        .time-modal {
            width: 100%;
            max-height: 92vh;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }

        .time-modal__header {
            padding: 20px 18px 16px;
        }

        .time-modal__title {
            font-size: 24px;
        }

        .time-modal__body {
            padding: 18px;
        }

        .time-modal__footer {
            flex-direction: column;
            align-items: stretch;
            padding: 16px 18px 20px;
        }

        .time-modal__actions {
            flex-direction: column-reverse;
            width: 100%;
        }

        .btn {
            width: 100%;
        }
    }
</style>