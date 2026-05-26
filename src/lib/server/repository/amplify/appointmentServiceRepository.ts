import {amplifyClient} from '$lib/client/amplifyClient';
import type {AppointmentServiceRepository} from '../types';

export const appointmentServiceRepository: AppointmentServiceRepository = {
    async createMany(appointmentId, serviceIds) {
        const results = await Promise.all(
            serviceIds.map(serviceId => amplifyClient.models.AppointmentService.create({appointmentId, serviceId}))
        );
        const errors = results.flatMap(r => r.errors ?? []);
        if (errors.length) throw new Error(errors.map(e => e.message).join(', '));
    }
};