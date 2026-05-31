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
        const {data, errors} = await amplifyClient.models.VehicleSpec.create(vehicleSpec);
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Vehicle creation failed');
        return toVehicleSpec(data as Record<string, unknown>);
    },

    async getById(id) {
        const {data, errors} = await amplifyClient.models.VehicleSpec.get({id});
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Getting Vehicle failed');
        return data ? toVehicleSpec(data as Record<string, unknown>) : null;
    },

    async list() {
        const {data, errors} = await amplifyClient.models.VehicleSpec.list();
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Getting Vehicles failed');
        return data.map(d => toVehicleSpec(d as Record<string, unknown>));
    },

    async delete(id) {
        const {errors} = await amplifyClient.models.VehicleSpec.delete({id});
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', ') ?? 'Deleting Vehicle failed');
    },

    async findOrCreate(year, make, model) {
        const {data, errors} = await amplifyClient.models.VehicleSpec.list({
            filter: {year: {eq: year}, make: {eq: make}, model: {eq: model}}
        });
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
        if (data.length) return toVehicleSpec(data[0] as Record<string, unknown>);

        const {data: created, errors: createErrors} = await amplifyClient.models.VehicleSpec.create({year, make, model});
        if (createErrors?.length || !created) throw new Error(createErrors?.map(e => e.message).join(', ') ?? 'Vehicle creation failed');
        return toVehicleSpec(created as Record<string, unknown>);
    }
};