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

    async update(id, updates) {
        const {data} = await amplifyClient.models.Service.update({id, ...updates});
        return toService(data as Record<string, unknown>);
    },

    async delete(id) {
        // DynamoDB doesn't cascade-delete on its own (unlike Postgres's ON DELETE
        // CASCADE for service_prices — see postgres/schema.sql) — do it explicitly so
        // both platforms behave the same way and don't leave orphaned price rows.
        const {data: prices} = await amplifyClient.models.ServicePrice.list({
            filter: {serviceId: {eq: id}}
        });
        await Promise.all(prices.map(price => amplifyClient.models.ServicePrice.delete({id: price.id})));
        await amplifyClient.models.Service.delete({id});
    },

    async list() {
        const {data} = await amplifyClient.models.Service.list();
        return data?.map(d => toService(d as Record<string, unknown>));
    },

    async listPrices() {
        const {data} = await amplifyClient.models.ServicePrice.list();
        return data.map(d => toServicePrice(d as Record<string, unknown>));
    },

    async upsertPrice(serviceId, vehicleCategory, price) {
        const {data: existing} = await amplifyClient.models.ServicePrice.list({
            filter: {serviceId: {eq: serviceId}, vehicleCategory: {eq: vehicleCategory}}
        });

        const {data} = existing[0]
            ? await amplifyClient.models.ServicePrice.update({id: existing[0].id, price})
            : await amplifyClient.models.ServicePrice.create({serviceId, vehicleCategory, price});

        return toServicePrice(data as Record<string, unknown>);
    }
};
