import {sql} from './db';
import type {Service, ServicePrice, ServiceRepository, VehicleCategory} from '../types';
import type {ServiceType} from '$lib/types';

export function toService(row: Record<string, unknown>): Service {
    return {
        id: row.id as string,
        name: row.name as string,
        description: row.description as string,
        serviceType: row.service_type as ServiceType
    };
}

function toServicePrice(row: Record<string, unknown>): ServicePrice {
    return {
        id: row.id as string,
        serviceId: row.service_id as string,
        vehicleCategory: row.vehicle_category as VehicleCategory,
        price: Number(row.price)
    };
}

export const postgresServiceRepository: ServiceRepository = {
    async getById(id) {
        const rows = await sql`SELECT * FROM services WHERE id = ${id}`;
        return rows[0] ? toService(rows[0]) : null;
    },

    async getByIds(serviceIds) {
        if (serviceIds.length === 0) return [];
        const rows = await sql`SELECT * FROM services WHERE id = ANY(${serviceIds}::text[])`;
        return rows.map(toService);
    },

    async list() {
        const rows = await sql`SELECT * FROM services`;
        return rows.map(toService);
    },

    async create(service) {
        const rows = await sql`
            INSERT INTO services (name, description, service_type)
            VALUES (${service.name}, ${service.description}, ${service.serviceType})
            RETURNING *`;
        return toService(rows[0]);
    },

    async update(id, updates) {
        const current = await this.getById(id);
        if (!current) throw new Error(`Service ${id} not found`);
        const merged = {...current, ...updates};

        const rows = await sql`
            UPDATE services
            SET name = ${merged.name},
                description = ${merged.description},
                service_type = ${merged.serviceType}
            WHERE id = ${id}
            RETURNING *`;

        return toService(rows[0]);
    },

    // service_prices.service_id has ON DELETE CASCADE (schema.sql) — no explicit
    // price cleanup needed here, unlike the Amplify implementation.
    async delete(id) {
        await sql`DELETE FROM services WHERE id = ${id}`;
    },

    async listPrices() {
        const rows = await sql`SELECT * FROM service_prices`;
        return rows.map(toServicePrice);
    },

    async upsertPrice(serviceId, vehicleCategory, price) {
        const rows = await sql`
            INSERT INTO service_prices (service_id, vehicle_category, price)
            VALUES (${serviceId}, ${vehicleCategory}, ${price})
            ON CONFLICT (service_id, vehicle_category)
            DO UPDATE SET price = excluded.price
            RETURNING *`;
        return toServicePrice(rows[0]);
    }
};
