import {error, fail} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {repositories} from '$lib/server/storage';
import {appointmentConfirmationEmail, appointmentNotificationEmail} from '$lib/server/appointmentEmails';
import {logger} from '$lib/server/logger';
import {zonedTimeToUtc, parseCalendarDay} from '$lib/shared/businessTime';


export const load: PageServerLoad = async () => {
    try {
        const [appointments, services, servicePrices] = await Promise.all([
            repositories.appointments.list(),
            repositories.services.list(),
            repositories.services.listPrices()
        ]);
        return {appointments: appointments ?? [], services: services ?? [], servicePrices: servicePrices ?? []};
    } catch (e) {
        error(500, 'Failed to load scheduling data');
    }
};


export const actions: Actions = {
    default: async ({request, locals}) => {
        const form = await request.formData();
        const year = String(form.get('year') ?? '');
        const make = String(form.get('make') ?? '');
        const model = String(form.get('model') ?? '');
        const dateString = String(form.get('date') ?? '');
        const time = String(form.get('time') ?? '');
        const serviceIds = form.getAll('serviceId').map(String).filter(Boolean);

        const pickedDay = parseCalendarDay(dateString);
        if (!year || !make || !model || !pickedDay || !time || !serviceIds.length) {
            return fail(400, {message: 'Please complete all fields before submitting.'});
        }

        const customerId = locals.user!.id;
        // setHours/setMinutes would set the hour in whatever timezone this process
        // happens to run in (UTC on the Lambda, the developer's own zone locally) —
        // that mismatch is exactly what let overlapping appointments through
        // unblocked in production. zonedTimeToUtc anchors the picked wall-clock time
        // to the business's actual timezone regardless of where this code runs.
        const [hour, minutes] = time.split(':').map(Number);
        const appointmentDate = zonedTimeToUtc(
            pickedDay.year,
            pickedDay.month,
            pickedDay.day,
            hour,
            minutes
        );

        try {
            const vehicle = await repositories.vehicles.findOrCreate(year, make, model);
            const  savedAppointment = await repositories.appointments.createAppointment(
                {customerId, vehicleId: vehicle.id, date: appointmentDate.toISOString()},
                serviceIds
            );
            await appointmentConfirmationEmail(locals.user!.email, savedAppointment.id);
            await appointmentNotificationEmail('JaysEmail@email.com', savedAppointment.id);

        } catch (e) {
            logger.error({err: e}, 'Booking failed');
            return fail(500, {message: 'Booking failed. Please try again.'});
        }

        return {success: true};
    }
};