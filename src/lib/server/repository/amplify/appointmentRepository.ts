import {amplifyClient} from '$lib/client/amplifyClient';
import type {Appointment, AppointmentRepository} from '../types';

function toAppointment(data: Record<string, unknown>): Appointment {
    return {
        id: data.id as string,
        customerId: data.customerId as string,
        vehicleId: data.vehicleId as string,
        date: data.date as string
    };
}

export const appointmentRepository: AppointmentRepository = {
    async getById(id) {
        const {data, errors} = await amplifyClient.models.Appointment.get({id});
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Getting Appointment failed');
        return data ? toAppointment(data as Record<string, unknown>) : null;
    },

    async delete(id) {
        const {errors} = await amplifyClient.models.Appointment.delete({id});
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', ') ?? 'Deleting Appointment failed');
    },

    async list() {
        const {data, errors} = await amplifyClient.models.Appointment.list();
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Getting Appointments failed');
        return data.map(appointment => toAppointment(appointment as Record<string, unknown>));
    },

    create(_void) {
        throw new Error('Not implemented');
    },

    async createAppointment(appointment, serviceIds) {
        const {data, errors} = await amplifyClient.models.Appointment.create(appointment);
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Appointment creation failed');

        const savedAppointment = toAppointment(data as Record<string, unknown>);
        const results = await Promise.all(
            serviceIds.map(serviceId =>
                amplifyClient.models.AppointmentService.create({appointmentId: savedAppointment.id, serviceId})
            )
        );
        const allErrors = results.flatMap(r => r.errors ?? []);
        if (allErrors.length) throw new Error(allErrors.map(e => e.message).join(', '));

        return savedAppointment;
    }
};