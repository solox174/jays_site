import {amplifyClient} from '$lib/client/amplifyClient';
import type {AppointmentServiceRepository} from '../types';

export const appointmentServiceRepository: AppointmentServiceRepository = {
    async createMany(appointmentId, serviceIds) {
        await Promise.all(
            serviceIds.map(serviceId => amplifyClient.models.AppointmentService.create({appointmentId, serviceId}))
        );
    }
};