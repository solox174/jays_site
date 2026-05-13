// src/routes/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { Schema } from '../../../amplify/data/resource'
import { signup } from '$lib/server/auth';
export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const form = await request.formData();
        const email = String(form.get('email') ?? '');
        const firstName = String(form.get('first-name') ?? '');
        const lastName = String(form.get('last-name') ?? '');
        const input = String(form.get('phone-number') ?? '');
        const phoneNumber = `+1${input.replace(/\D/g, '')}`;
        const password = String(form.get('password') ?? '');
        const confirmPassword = String(form.get('confirm-password') ?? '');

        const customer: Schema['Customer']['createType'] = {
            firstName,
            lastName,
            phoneNumber,
            email,
            password
        }
        const result = await signup(customer);

        if (!result.ok) {
            return fail(400, { message: 'Signup failed', challengeName: result.challengeName });
        }

        redirect(303, '/scheduling');
    }
};