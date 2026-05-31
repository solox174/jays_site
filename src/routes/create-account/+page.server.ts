import type {Actions} from './$types';
import {authService} from '$lib/server/auth';
import {fail, redirect} from "@sveltejs/kit";
import {logger} from "$lib/server/logger";
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

        if (password !== confirmPassword) return {errorText: 'Passwords do not match'};

        const customer = {firstName, lastName, phoneNumber, email};

        // TODO: enforce password complexity requirements in UI
        try {
            const result = await authService.signup(customer, password);
            if (!result.ok || !result.userSub) throw new Error('Account creation failed');
            await repositories.customers.create(customer);
        } catch (e) {
            const errorText = e instanceof Error ? e.message : 'Unknown error';
            logger.error(`Signup failed: ${errorText}`);
            return fail(400, {errorText});
        }

        return {state: 'captureCode'};
    },

    confirmSignup: async ({request}) => {
        const form = await request.formData();
        const code = String(form.get('confirmation-code') ?? '');
        const email = String(form.get('email') ?? '');

        try {
            await authService.confirmSignup(email, code);
        } catch (e) {
            const errorText = e instanceof Error ? e.message : 'Unknown error';
            logger.error(`Confirmation failed: ${errorText}`);
            return fail(400, {errorText});
        }

        redirect(301, '/login?firstLogin=true');
    }
};