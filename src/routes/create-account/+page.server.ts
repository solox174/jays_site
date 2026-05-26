import type {Actions} from './$types';
import type {Schema} from '../../../amplify/data/resource'
import {signup, confirmSignup} from '$lib/server/auth';

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

        const customer: Schema['Customer']['createType'] = {
            firstName,
            lastName,
            phoneNumber,
            email,
            password
        }
        // TODO: enforce password complexity requirements in UI
        const result = await signup(customer);

        if (!result.ok) {
            return {errorText:'Account creation failed'};
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

        await confirmSignup(email, code);
    }
}