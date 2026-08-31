import {error, fail} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {repositories} from '$lib/server/storage';
import {logger} from '$lib/server/logger';
import {ServiceType} from '$lib/types';
import type {VehicleCategory} from '$lib/server/storage/types';

const VEHICLE_CATEGORIES: VehicleCategory[] = ['coupe', 'sedan', 'van', 'suv', 'jeep', 'truck'];

export const load: PageServerLoad = async () => {
    try {
        const [services, prices] = await Promise.all([
            repositories.services.list(),
            repositories.services.listPrices()
        ]);
        return {services: services ?? [], prices};
    } catch (e) {
        error(500, 'Failed to load services');
    }
};

export const actions: Actions = {
    saveService: async ({request}) => {
        const form = await request.formData();
        const id = String(form.get('id') ?? '') || undefined;
        const name = String(form.get('name') ?? '').trim();
        const description = String(form.get('description') ?? '').trim();
        const serviceType = String(form.get('serviceType') ?? '') as ServiceType;

        if (!name || !description || !Object.values(ServiceType).includes(serviceType)) {
            return fail(400, {message: 'Please fill in all fields.'});
        }

        try {
            const service = id
                ? await repositories.services.update(id, {name, description, serviceType})
                : await repositories.services.create({name, description, serviceType});

            if (!service) {
                return fail(500, {message: 'Failed to save service. Please try again.'});
            }

            await Promise.all(
                VEHICLE_CATEGORIES.map(category => {
                    const raw = form.get(`price_${category}`);
                    const parsed = raw === null || raw === '' ? 0 : Number(raw);
                    const price = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
                    return repositories.services.upsertPrice(service.id, category, price);
                })
            );
        } catch (e) {
            logger.error({err: e}, 'Failed to save service');
            return fail(500, {message: 'Failed to save service. Please try again.'});
        }

        return {success: true};
    },

    deleteService: async ({request}) => {
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, {message: 'Missing service id.'});

        try {
            await repositories.services.delete(id);
        } catch (e) {
            logger.error({err: e}, 'Failed to delete service');
            return fail(500, {message: 'Failed to delete service. Please try again.'});
        }

        return {success: true};
    }
};
