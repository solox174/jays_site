import {sql} from './db';
import type {AppointmentServiceRepository} from '../types';

export const postgresAppointmentServiceRepository: AppointmentServiceRepository = {
    async createMany(appointmentId, serviceIds) {
        await Promise.all(
            serviceIds.map(serviceId => sql`
                INSERT INTO appointment_services (appointment_id, service_id)
                VALUES (${appointmentId}, ${serviceId})`)
        );
    }
};
