import {amplifyClient} from '$lib/client/amplifyClient';
import {type Service, type ServicePrice, type ServiceRepository, type VehicleCategory} from '../types';
import type {ServiceType} from "$lib/types";

export function toService(data: Record<string, unknown>): Service {
    return {
        id: data.id as string,
        name: data.name as string,
        description: data.description as string,
        serviceType: data.serviceType as ServiceType
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
    async create(service) {
        const {data} = await amplifyClient.models.Service.create(service);
        return toService(data as Record<string, unknown>);
    },

    async getById(id) {
        const ids = [id]
        const servicesPromise = this.getByIds(ids);
        return (await servicesPromise)?.[0];
    },

    async getByIds(serviceIds: string[]) {
        const {data} = await amplifyClient.models.Service.list();
        return data.filter(d => serviceIds.includes(d.id))
            .map(d => toService(d as Record<string, unknown>));
    },

    async delete(id) {
        await amplifyClient.models.Service.delete({id});
    },

    async list() {
        const {data} = await amplifyClient.models.Service.list();
        return data?.map(d => toService(d as Record<string, unknown>));
    },

    async listPrices() {
        const {data} = await amplifyClient.models.ServicePrice.list();
        return data.map(d => toServicePrice(d as Record<string, unknown>));
    }
};
