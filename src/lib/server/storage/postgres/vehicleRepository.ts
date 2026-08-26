import {sql} from './db';
import type {VehicleRepository, VehicleSpec} from '../types';

function toVehicle(row: Record<string, unknown>): VehicleSpec {
    return {
        id: row.id as string,
        year: row.year as string,
        make: row.make as string,
        model: row.model as string
    };
}

export const postgresVehicleRepository: VehicleRepository = {
    async getById(id) {
        const rows = await sql`SELECT * FROM vehicle_specs WHERE id = ${id}`;
        return rows[0] ? toVehicle(rows[0]) : null;
    },

    async list() {
        const rows = await sql`SELECT * FROM vehicle_specs`;
        return rows.map(toVehicle);
    },

    async create(vehicle) {
        const rows = await sql`
            INSERT INTO vehicle_specs (year, make, model)
            VALUES (${vehicle.year}, ${vehicle.make}, ${vehicle.model})
            RETURNING *`;
        return toVehicle(rows[0]);
    },

    async delete(id) {
        await sql`DELETE FROM vehicle_specs WHERE id = ${id}`;
    },

    // Find-or-create pattern: avoids duplicate VehicleSpec records for the same
    // year/make/model by querying before inserting.
    async findOrCreate(year, make, model) {
        const existing = await sql`
            SELECT * FROM vehicle_specs WHERE year = ${year} AND make = ${make} AND model = ${model}`;
        if (existing[0]) return toVehicle(existing[0]);

        const rows = await sql`
            INSERT INTO vehicle_specs (year, make, model)
            VALUES (${year}, ${make}, ${model})
            RETURNING *`;
        return toVehicle(rows[0]);
    }
};
