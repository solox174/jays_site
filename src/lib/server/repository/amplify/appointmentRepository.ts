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
        const {data} = await amplifyClient.models.Appointment.get({id});
        return data ? toAppointment(data as Record<string, unknown>) : null;
    },

    async delete(id) {
        await amplifyClient.models.Appointment.delete({id});
    },

    async list() {
        const {data} = await amplifyClient.models.Appointment.list();
        return data.map(appointment => toAppointment(appointment as Record<string, unknown>));
    },

    create(_void) {
        throw new Error('Not implemented');
    },

    async createAppointment(appointment, serviceIds) {
        const {data} = await amplifyClient.models.Appointment.create(appointment);
        const savedAppointment = toAppointment(data as Record<string, unknown>);
        // AppointmentService records are independent of each other, so create them
        // concurrently rather than sequentially.
        await Promise.all(
            serviceIds.map(serviceId =>
                amplifyClient.models.AppointmentService.create({appointmentId: savedAppointment.id, serviceId})
            )
        );
        return savedAppointment;
    }
};