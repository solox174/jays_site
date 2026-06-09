import {fail, redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import {authService} from '$lib/server/auth';
import {logger} from '$lib/server/logger';

export const load = async ({url}) => {
    return {from: url.searchParams.get('from')};
};

export const actions: Actions = {
    default: async ({request, url, cookies}) => {
        const form = await request.formData();
        const email = String(form.get('email') ?? '');
        const password = String(form.get('password') ?? '');
        let errorText;

        try {
            const result = await authService.login(email, password, cookies);

            if (!result.ok) {
                errorText = `Login failed\nchallengeName: ${result.challengeName}`;
                logger.error(errorText);
                return fail(400, {errorText});
            }
        } catch (error) {
            errorText = error instanceof Error ? error.message : 'Login failed';
            logger.error(errorText);
            return fail(400, {errorText});
        }

        redirect(303, url.searchParams.get('from') ?? '/');
    }
};