import {sql} from './db';
import type {Customer, CustomerRepository, UserRole} from '../types';

function toCustomer(row: Record<string, unknown>): Customer {
    return {
        id: row.id as string,
        firstName: row.first_name as string | null,
        lastName: row.last_name as string,
        phoneNumber: row.phone_number as string,
        email: row.email as string,
        role: (row.role as UserRole | undefined) ?? 'customer'
    };
}

export const postgresCustomerRepository: CustomerRepository = {
    async getById(id) {
        const rows = await sql`SELECT * FROM customers WHERE id = ${id}`;
        return rows[0] ? toCustomer(rows[0]) : null;
    },

    async list() {
        const rows = await sql`SELECT * FROM customers`;
        return rows.map(toCustomer);
    },

    async create(customer) {
        const {id, firstName, lastName, phoneNumber, email} = customer;

        // Cognito's sub is passed as the id on first login (see login/+page.server.ts) —
        // fall back to a DB-generated id when none is given.
        const rows = id
            ? await sql`
                INSERT INTO customers (id, first_name, last_name, phone_number, email, password)
                VALUES (${id}, ${firstName ?? null}, ${lastName}, ${phoneNumber}, ${email}, 'managed-by-cognito')
                RETURNING *`
            : await sql`
                INSERT INTO customers (first_name, last_name, phone_number, email, password)
                VALUES (${firstName ?? null}, ${lastName}, ${phoneNumber}, ${email}, 'managed-by-cognito')
                RETURNING *`;

        return toCustomer(rows[0]);
    },

    async update(id, updates) {
        const current = await this.getById(id);
        if (!current) throw new Error(`Customer ${id} not found`);
        const merged = {...current, ...updates};

        const rows = await sql`
            UPDATE customers
            SET first_name = ${merged.firstName ?? null},
                last_name = ${merged.lastName},
                phone_number = ${merged.phoneNumber},
                email = ${merged.email},
                role = ${merged.role}
            WHERE id = ${id}
            RETURNING *`;

        return toCustomer(rows[0]);
    },

    async delete(id) {
        await sql`DELETE FROM customers WHERE id = ${id}`;
    }
};
