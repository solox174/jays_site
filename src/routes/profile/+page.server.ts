import {error, fail} from '@sveltejs/kit';
import type {Actions, PageServerLoad} from './$types';
import {repositories} from '$lib/server/repository';
import {authService} from '$lib/server/auth';
import {logger} from '$lib/server/logger';

export const load: PageServerLoad = async ({locals}) => {
    const customer = await repositories.customers.getById(locals.user!.id);
    if (!customer) error(404, 'Customer record not found');

    // Stored as E.164 (+1XXXXXXXXXX); the form field expects just the 10-digit
    // national number, matching create-account's input/normalization convention.
    return {phoneNumber: customer.phoneNumber.replace(/^\+1/, '')};
};

export const actions: Actions = {
    updatePhone: async ({request, locals}) => {
        const form = await request.formData();
        const input = String(form.get('phone-number') ?? '');
        const phoneNumber = `+1${input.replace(/\D/g, '')}`;

        if (phoneNumber.length !== 12) {
            return fail(400, {form: 'phone' as const, errorText: 'Enter a valid 10-digit phone number'});
        }

        try {
            await repositories.customers.update(locals.user!.id, {phoneNumber});
        } catch (e) {
            logger.error(`Failed to update phone number: ${e}`);
            return fail(500, {form: 'phone' as const, errorText: 'Failed to update phone number'});
        }

        return {form: 'phone' as const, success: true};
    },

    updatePassword: async ({request, locals}) => {
        const form = await request.formData();
        const currentPassword = String(form.get('current-password') ?? '');
        const newPassword = String(form.get('new-password') ?? '');
        const confirmPassword = String(form.get('confirm-password') ?? '');

        if (newPassword !== confirmPassword) {
            return fail(400, {form: 'password' as const, errorText: 'New passwords do not match'});
        }

        if (!locals.accessToken) {
            return fail(401, {form: 'password' as const, errorText: 'Your session has expired — please log in again'});
        }

        const result = await authService.changePassword(locals.accessToken, currentPassword, newPassword);
        if (!result.ok) {
            return fail(400, {form: 'password' as const, errorText: result.errorText});
        }

        return {form: 'password' as const, success: true};
    }
};
