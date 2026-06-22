import {fail, redirect} from '@sveltejs/kit';
import type {Actions} from './$types';
import {authService} from '$lib/server/auth';
import {logger} from '$lib/server/logger';
import {repositories} from '$lib/server/repository';

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

            // Create the customer record on first login — deferred from signup
            // because the user has no JWT at signup time and AppSync requires one.
            try {
                const existing = await repositories.customers.getById(result.user.id);
                if (!existing) {
                    await repositories.customers.create({
                        id: result.user.id,
                        email: result.user.email ?? '',
                        firstName: result.user.firstName,
                        lastName: result.user.lastName ?? '',
                        phoneNumber: result.user.phoneNumber ?? ''
                    });
                }
            } catch (e) {
                logger.error(`Failed to find-or-create customer on login: ${e}`);
            }
        } catch (error) {
            errorText = error instanceof Error ? error.message : 'Login failed';
            logger.error(errorText);
            return fail(400, {errorText});
        }

        redirect(303, url.searchParams.get('from') ?? '/');
    }
};