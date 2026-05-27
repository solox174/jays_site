import type {Actions} from './$types';
import {authService} from '$lib/server/auth';
import {repositories} from '$lib/server/repository';

export const actions: Actions = {
    createAccount: async ({request, cookies}) => {
        const form = await request.formData();
        const email = String(form.get('email') ?? '');
        const firstName = String(form.get('first-name') ?? '');
        const lastName = String(form.get('last-name') ?? '');
        const input = String(form.get('phone-number') ?? '');
        const phoneNumber = `+1${input.replace(/\D/g, '')}`;
        const password = String(form.get('password') ?? '');
        const confirmPassword = String(form.get('confirm-password') ?? '');
        let errorText;

        if (password !== confirmPassword) return {errorText: 'Passwords do not match'};

        const customer = {
            firstName,
            lastName,
            phoneNumber,
            email
        };
        // TODO: enforce password complexity requirements in UI
        const result = await authService.signup(customer, password);

        if (!result.ok || !result.userSub) {
            return {errorText: 'Account creation failed'};
        }
        try {
            await repositories.customers.create({...customer, id: result.userSub});
        } catch (error) {
            console.error('Customer record creation failed, will upsert on login', error);
        }

        return {
            state: 'captureCode',
            errorText
        }
    },
    confirmSignup: async ({request, cookies}) => {
        const form = await request.formData();
        const code = String(form.get('confirmation-code') ?? '');
        const email = String(form.get('email') ?? '');

        await authService.confirmSignup(email, code);
    }
}