import {amplifyClient} from '$lib/client/amplifyClient';
import type {Appointment, AppointmentRepository} from '../types';
import {toService} from "$lib/server/repository/amplify/serviceRepository";

function toAppointment(data: Record<string, unknown>): Appointment {
    return {
        id: data.id as string,
        customerId: data.customerId as string,
        vehicleId: data.vehicleId as string,
        date: data.date as string
    };
}

export const appointmentRepository: AppointmentRepository = {
    async getById(id, eagerFetch) {
        const ss = eagerFetch ? { selectionSet: ['id', 'date', 'customer.*', 'vehicle.*', 'appointmentServices.*', 'appointmentServices.service.*'] as const }: undefined

        const {data} = await amplifyClient.models.Appointment.get({id}, ss);
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
    },

    async getServices(appointmentId: string) {
        const id = appointmentId;
        const { data: appointmentServices } = await amplifyClient.models.AppointmentService.list({
            filter: { appointmentId: { eq: id } }
        });
        const serviceIds = appointmentServices?.map(appointmentService => appointmentService.serviceId)
        const {data: services} = await amplifyClient.models.Service.list();
        return services.filter( service => serviceIds.includes(service.id))
            .map(d => toService(d as Record<string, unknown>));
    }
};