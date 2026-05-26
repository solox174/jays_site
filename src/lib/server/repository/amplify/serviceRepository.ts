import {amplifyClient} from '$lib/client/amplifyClient';
import type {Service, ServicePrice, ServiceRepository, VehicleCategory} from '../types';

function toService(data: Record<string, unknown>): Service {
    return {
        id: data.id as string,
        name: data.name as string,
        description: data.description as string,
        isExclusive: data.isExclusive as boolean
    };
}

function toServicePrice(data: Record<string, unknown>): ServicePrice {
    return {
        id: data.id as string,
        serviceId: data.serviceId as string,
        vehicleCategory: data.vehicleCategory as VehicleCategory,
        price: data.price as number
    };
}

export const serviceRepository: ServiceRepository = {
    async list() {
        const {data, errors} = await amplifyClient.models.Service.list();
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
        return data.map(d => toService(d as Record<string, unknown>));
    },

    async listPrices() {
        const {data, errors} = await amplifyClient.models.ServicePrice.list();
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
        return data.map(d => toServicePrice(d as Record<string, unknown>));
    }
};