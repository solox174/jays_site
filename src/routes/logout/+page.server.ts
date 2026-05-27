import type {PageServerLoad} from './$types';
import {redirect} from '@sveltejs/kit';
import {authService} from '$lib/server/auth';

export const load: PageServerLoad = async ({cookies}) => {
    await authService.logout(cookies);
    redirect(303, '/login');
};