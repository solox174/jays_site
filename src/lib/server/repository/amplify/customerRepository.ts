import {amplifyClient} from '$lib/client/amplifyClient';
import type {Customer, CustomerRepository} from '../types';

function toCustomer(data: Record<string, unknown>): Customer {
    return {
        id: data.id as string,
        firstName: data.firstName as string | null,
        lastName: data.lastName as string,
        phoneNumber: data.phoneNumber as string,
        email: data.email as string
    };
}

export const customerRepository: CustomerRepository = {
    async create(customer) {
        // TODO: remove password from Customer schema — Cognito owns auth
        const {data, errors} = await amplifyClient.models.Customer.create({
            ...customer,
            password: 'managed-by-cognito'
        });
        if (errors?.length || !data) throw new Error(errors?.map(e => e.message).join(', ') ?? 'Customer creation failed');
        return toCustomer(data as Record<string, unknown>);
    },

    async getById(id) {
        const {data, errors} = await amplifyClient.models.Customer.get({id});
        if (errors?.length) throw new Error(errors.map(e => e.message).join(', '));
        if (!data) return null;
        return toCustomer(data as Record<string, unknown>);
    }
};