import {error} from '@sveltejs/kit';
import type {PageServerLoad} from './$types';
import {repositories} from '$lib/server/repository';


export const load: PageServerLoad = async () => {
    try {
        const services = await repositories.services.list();
        return {services: services ?? []};
    } catch (e) {
        error(500, 'Failed to load scheduling data');
    }
};