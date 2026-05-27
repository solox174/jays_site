import {fail, redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import {authService} from '$lib/server/auth';
import {repositories} from '$lib/server/repository';

export const load = async ({ url }) => {
    return { from: url.searchParams.get('from') };
};


export const actions: Actions = {
    default: async ({request, url, cookies}) => {
        const form = await request.formData();
        const username = String(form.get('email') ?? '');
        const password = String(form.get('password') ?? '');

        const result = await authService.login(username, password, cookies);

        if (!result.ok) {
            return fail(400, {message: 'Login failed', challengeName: result.challengeName});
        }

        const existing = await repositories.customers.getById(result.user.id);
        if (!existing) {
            try {
                await repositories.customers.create({
                    id: result.user.id,
                    email: result.user.email ?? '',
                    firstName: result.user.firstName ?? null,
                    lastName: result.user.lastName ?? '',
                    phoneNumber: result.user.phoneNumber ?? ''
                });
            } catch (error) {
                console.error('Customer upsert on login failed', error);
            }
        }

        redirect(303, url.searchParams.get('from') ?? '/scheduling');
    }
};