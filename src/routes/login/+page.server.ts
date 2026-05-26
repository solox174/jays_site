// src/routes/login/+page.server.ts
import {fail, redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import {login} from '$lib/server/auth';

export const load = async ({ url }) => {
    return { from: url.searchParams.get('from') };
};


export const actions: Actions = {
    default: async ({request, url, cookies}) => {
        const form = await request.formData();
        const username = String(form.get('email') ?? '');
        const password = String(form.get('password') ?? '');

        const result = await login(username, password, cookies);

        if (!result.ok) {
            return fail(400, {message: 'Login failed', challengeName: result.challengeName});
        }

        redirect(303, url.searchParams.get('from') ?? '/scheduling');
    }
};