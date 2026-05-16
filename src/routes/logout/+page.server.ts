import type {PageServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';
import {logout} from '$lib/server/auth';

export const load: PageServerLoad = async ({cookies}) => {
    await logout(cookies);
    redirect(303, '/login');
};