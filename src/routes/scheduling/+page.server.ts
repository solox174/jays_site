import {error, fail} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {repositories} from '$lib/server/repository';

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

// TODO: use `@aws-sdk/client-ses` to send email with appointment details to Jay and confirmation email to customer
// TODO: ADD appointment confirmation message to confirm appointment "Your appointment is confirmed for May 20th at 10AM"
export const actions: Actions = {
    default: async ({request, locals}) => {
        const form = await request.formData();
        const year = String(form.get('year') ?? '');
        const make = String(form.get('make') ?? '');
        const model = String(form.get('model') ?? '');
        const dateString = String(form.get('date') ?? '');
        const time = String(form.get('time') ?? '');
        const serviceIds = form.getAll('serviceId').map(String).filter(Boolean);

        if (!year || !make || !model || !dateString || !time || !serviceIds.length) {
            return fail(400, {message: 'Please complete all fields before submitting.'});
        }

        const customerId = locals.user!.id;
        const appointmentDate = new Date(dateString);
        const [hour, minutes] = time.split(':');
        appointmentDate.setHours(Number(hour));
        appointmentDate.setMinutes(Number(minutes));

        try {
            const vehicle = await repositories.vehicles.findOrCreate(year, make, model);
            await repositories.appointments.createAppointment(
                {customerId, vehicleId: vehicle.id, date: appointmentDate.toISOString()},
                serviceIds
            );
        } catch (e) {
            return fail(500, {message: 'Booking failed. Please try again.'});
        }

        return {success: true};
    }
};