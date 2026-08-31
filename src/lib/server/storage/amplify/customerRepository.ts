import {amplifyClient} from '$lib/client/amplifyClient';
import type {Customer, CustomerRepository, UserRole} from '../types';

function toCustomer(data: Record<string, unknown>): Customer {
    return {
        id: data.id as string,
        firstName: data.firstName as string | null,
        lastName: data.lastName as string,
        phoneNumber: data.phoneNumber as string,
        email: data.email as string,
        // Fallback only matters for rows that predate this field — create() below
        // always writes role explicitly now, so this is a safety net, not the primary
        // mechanism (enum refs don't support a schema-level default, see
        // amplify/data/resource.ts, so there's no other way to backfill old rows).
        role: (data.role as UserRole | undefined) ?? 'customer'
    };
}

export const customerRepository: CustomerRepository = {
    async getById(id) {
        const {data} = await amplifyClient.models.Customer.get({id});
        return data ? toCustomer(data as Record<string, unknown>) : null;
    },

    async delete(id) {
        await amplifyClient.models.Customer.delete({id});
    },

    async list() {
        const {data} = await amplifyClient.models.Customer.list();
        return data.map(d => toCustomer(d as Record<string, unknown>));
    },

    async create(customer) {
        const {data} = await amplifyClient.models.Customer.create({
            ...customer,
            password: 'managed-by-cognito',
            // Written explicitly rather than left absent — role has no schema-level
            // default (enum refs don't support one), and leaving it unset made every
            // new customer's DynamoDB item silently missing the attribute, confusing
            // to anyone browsing the console expecting to see an actual value.
            role: 'customer'
        });
        return toCustomer(data as Record<string, unknown>);
    },

    async update(id, updates) {
        const {data} = await amplifyClient.models.Customer.update({id, ...updates});
        return toCustomer(data as Record<string, unknown>);
    }
};