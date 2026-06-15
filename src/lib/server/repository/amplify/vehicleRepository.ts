import {amplifyClient} from '$lib/client/amplifyClient';
import type {VehicleRepository, VehicleSpec} from '../types';

function toVehicleSpec(data: Record<string, unknown>): VehicleSpec {
    return {
        id: data.id as string,
        year: data.year as string,
        make: data.make as string,
        model: data.model as string
    };
}

export const vehicleRepository: VehicleRepository = {
    async create(vehicleSpec) {
        const {data} = await amplifyClient.models.VehicleSpec.create(vehicleSpec);
        return toVehicleSpec(data as Record<string, unknown>);
    },

    async getById(id) {
        const {data} = await amplifyClient.models.VehicleSpec.get({id});
        return data ? toVehicleSpec(data as Record<string, unknown>) : null;
    },

    async list() {
        const {data} = await amplifyClient.models.VehicleSpec.list();
        return data.map(d => toVehicleSpec(d as Record<string, unknown>));
    },

    async delete(id) {
        await amplifyClient.models.VehicleSpec.delete({id});
    },

    // Find-or-create pattern: avoids duplicate VehicleSpec records for the same
    // year/make/model by querying before inserting.
    async findOrCreate(year, make, model) {
        const {data} = await amplifyClient.models.VehicleSpec.list({
            filter: {year: {eq: year}, make: {eq: make}, model: {eq: model}}
        });
        if (data.length) return toVehicleSpec(data[0] as Record<string, unknown>);

        const {data: created} = await amplifyClient.models.VehicleSpec.create({year, make, model});
        return toVehicleSpec(created as Record<string, unknown>);
    }
};