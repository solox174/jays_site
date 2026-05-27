import {amplifyClient} from '$lib/client/amplifyClient';
import type {Appointment, AppointmentRepository} from '../types';
import {data} from "../../../../../amplify/data/resource";

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
        const {data, errors} =  await amplifyClient.models.Appointment.get({id});
        return toAppointment(data as Record<string, unknown>);
    },

    async delete(id) {
        await amplifyClient.models.Appointment.delete({id});
    },

    async list() {
        const {data, errors} = await amplifyClient.models.Appointment.list();
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
        return data.map(d => toAppointment(d as Record<string, unknown>));
    },

    async create(appointment) {
        const {data, errors} = await amplifyClient.models.Appointment.create(appointment);
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Appointment creation failed');
        return toAppointment(data as Record<string, unknown>);
    }
};