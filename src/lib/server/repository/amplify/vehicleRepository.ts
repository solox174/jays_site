import {amplifyClient} from '$lib/client/amplifyClient';
import type {VehicleRepository, VehicleSpec} from '../types';
import {data} from "../../../../../amplify/data/resource";

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
        const {data, errors} = await amplifyClient.models.VehicleSpec.create(vehicleSpec);
        return toVehicleSpec(data as Record<string, unknown>);
    },

    async getById(id) {
        const {data, errors} = await amplifyClient.models.VehicleSpec.get({id});
        return toVehicleSpec(data as Record<string, unknown>);
    },

    async list() {
        const {data, errors} = await amplifyClient.models.VehicleSpec.list();
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
        return data.map(d => toVehicleSpec(d as Record<string, unknown>));
    },

    async delete(id) {
        await amplifyClient.models.VehicleSpec.delete({id});
    },
    async findOrCreate(year, make, model) {
        const {data: existing, errors} = await amplifyClient.models.VehicleSpec.list({
            filter: {
                and: [
                    {year: {eq: year}},
                    {make: {eq: make}},
                    {model: {eq: model}}
                ]
            }
        });

        if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
        if (existing.length > 0) return toVehicleSpec(existing[0] as Record<string, unknown>);

        const {data, errors: createErrors} = await amplifyClient.models.VehicleSpec.create({year, make, model});
        if (createErrors?.length || !data) throw new Error(createErrors?.map(e => e.message).join(', ') ?? 'Vehicle creation failed');
        return toVehicleSpec(data as Record<string, unknown>);
    }
};