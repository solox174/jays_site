import {sql} from './db';
import type {Appointment, AppointmentRepository} from '../types';
import {toService} from './serviceRepository';

function toAppointment(row: Record<string, unknown>): Appointment {
    const date = row.date;
    return {
        id: row.id as string,
        customerId: row.customer_id as string,
        vehicleId: row.vehicle_id as string,
        date: date instanceof Date ? date.toISOString() : (date as string)
    };
}

export const postgresAppointmentRepository: AppointmentRepository = {
    async getById(id) {
        const rows = await sql`SELECT * FROM appointments WHERE id = ${id}`;
        return rows[0] ? toAppointment(rows[0]) : null;
    },

    async list() {
        const rows = await sql`SELECT * FROM appointments`;
        return rows.map(toAppointment);
    },

    async create(appointment) {
        const rows = await sql`
            INSERT INTO appointments (customer_id, vehicle_id, date)
            VALUES (${appointment.customerId}, ${appointment.vehicleId}, ${appointment.date})
            RETURNING *`;
        return toAppointment(rows[0]);
    },

    async delete(id) {
        await sql`DELETE FROM appointments WHERE id = ${id}`;
    },

    async createAppointment(appointment, serviceIds) {
        const rows = await sql`
            INSERT INTO appointments (customer_id, vehicle_id, date)
            VALUES (${appointment.customerId}, ${appointment.vehicleId}, ${appointment.date})
            RETURNING *`;
        const savedAppointment = toAppointment(rows[0]);

        // AppointmentService records are independent of each other, so create them
        // concurrently rather than sequentially — matches the Amplify implementation's
        // behavior (not atomic with the appointment insert there either).
        await Promise.all(
            serviceIds.map(serviceId => sql`
                INSERT INTO appointment_services (appointment_id, service_id)
                VALUES (${savedAppointment.id}, ${serviceId})`)
        );

        return savedAppointment;
    },

    async getServices(appointmentId) {
        const rows = await sql`
            SELECT s.* FROM services s
            JOIN appointment_services aps ON aps.service_id = s.id
            WHERE aps.appointment_id = ${appointmentId}`;
        return rows.map(toService);
    }
};
