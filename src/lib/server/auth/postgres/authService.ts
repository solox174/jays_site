import type {Cookies} from '@sveltejs/kit';
import {randomBytes} from 'node:crypto';
import {sql} from '$lib/server/storage/postgres/db';
import {emailService} from '$lib/server/email';
import {emailConfig} from '$lib/server/email/config';
import {logger} from '$lib/server/logger';
import {hashPassword, verifyPassword} from './password';
import type {AuthService, NewUser} from '../types';

const TOKEN_COOKIE = 'id_token';
const ACCESS_TOKEN_COOKIE = 'access_token';
// No ID-vs-access-token distinction natively — that's a Cognito/OAuth concept. Both
// cookies get the same opaque session token so hooks.server.ts's existing reads of
// both names keep working unchanged.
const SESSION_TTL_MS = 60 * 60 * 1000; // matches Cognito's cookie maxAge below
const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;

function setSessionCookie(cookies: Cookies, name: string, token: string) {
    cookies.set(name, token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60
    });
}

function generateSessionToken(): string {
    return randomBytes(32).toString('hex');
}

function generateVerificationCode(): string {
    return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

async function createSession(customerId: string): Promise<string> {
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await sql`INSERT INTO sessions (token, customer_id, expires_at) VALUES (${token}, ${customerId}, ${expiresAt})`;
    return token;
}

// Expired rows are never deleted by a logout (that only removes its own row) — pg_cron
// would be the clean answer (runs on a real schedule, zero request latency) but isn't
// usable here: it's listed as available on this Neon project, but actually creating it
// requires access to Neon's separate `postgres` system database that the neondb_owner
// role doesn't have ("permission denied to create extension pg_cron", confirmed by
// hand — see storage/postgres/schema.sql). So instead: a small, self-balancing chance
// on each lookup to also sweep every expired row, piggybacking on request traffic that
// already exists rather than adding new infrastructure.
const SESSION_CLEANUP_PROBABILITY = 0.01;

// Opaque DB-verified session lookup — the Postgres-native alternative to Cognito's JWT
// signature verification. One extra query per authenticated request, no signing secret.
async function getSessionCustomerId(token: string): Promise<string | null> {
    if (Math.random() < SESSION_CLEANUP_PROBABILITY) {
        // Awaited, not fire-and-forget: on Vercel's serverless runtime an un-awaited
        // promise can get cut off once the response is sent, so this can't be a
        // best-effort background task — it has to actually finish here.
        try {
            await sql`DELETE FROM sessions WHERE expires_at < now()`;
        } catch (e) {
            logger.error(`Session cleanup sweep failed: ${e}`);
        }
    }

    const rows = await sql`SELECT customer_id FROM sessions WHERE token = ${token} AND expires_at > now()`;
    return rows[0] ? (rows[0].customer_id as string) : null;
}

// Shared by signup and resendConfirmationCode — generates a fresh code, overwrites
// whatever's on the customer's email_verifications row, and emails it.
async function issueVerificationCode(customerId: string, email: string): Promise<void> {
    const code = generateVerificationCode();
    const codeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS).toISOString();
    await sql`
        INSERT INTO email_verifications (customer_id, verified, code, code_expires_at)
        VALUES (${customerId}, false, ${code}, ${codeExpiresAt})
        ON CONFLICT (customer_id) DO UPDATE SET code = excluded.code, code_expires_at = excluded.code_expires_at`;

    await emailService.send(
        email,
        'Verify your Jays Auto Detailing account',
        `Your confirmation code is: ${code}\n\nThis code expires in 15 minutes.`,
        emailConfig.confirmationFromAddress
    );
}

export const postgresAuthService: AuthService = {
    async signup(user: NewUser, password: string) {
        const passwordHash = await hashPassword(password);

        // Resumable signup: an unconfirmed row for this email already existing isn't a
        // hard failure — it's most likely a previous attempt where the confirmation
        // email never got sent (Resend/domain issue) or a double-submitted form, not a
        // real "this email is taken." Reuse the row, refresh it with what was just
        // submitted, and issue a fresh code rather than failing on the unique
        // constraint. A *confirmed* existing account is still a real conflict.
        const existing = await sql`
            SELECT c.id, v.verified FROM customers c
            LEFT JOIN email_verifications v ON v.customer_id = c.id
            WHERE c.email = ${user.email}`;

        if (existing[0]) {
            if (existing[0].verified) return {ok: false, errorText: 'An account with this email already exists.'};

            const customerId = existing[0].id as string;
            await sql`
                UPDATE customers
                SET first_name = ${user.firstName ?? null}, last_name = ${user.lastName},
                    phone_number = ${user.phoneNumber}, password = ${passwordHash}
                WHERE id = ${customerId}`;
            await issueVerificationCode(customerId, user.email);
            return {ok: true, userConfirmed: false, userSub: customerId};
        }

        let customerId: string;
        try {
            const rows = await sql`
                INSERT INTO customers (first_name, last_name, phone_number, email, password)
                VALUES (${user.firstName ?? null}, ${user.lastName}, ${user.phoneNumber}, ${user.email}, ${passwordHash})
                RETURNING id`;
            customerId = rows[0].id as string;
        } catch (e) {
            logger.error(`Customer insert failed during signup: ${e}`);
            return {ok: false};
        }

        await issueVerificationCode(customerId, user.email);

        return {ok: true, userConfirmed: false, userSub: customerId};
    },

    async resendConfirmationCode(username: string) {
        const rows = await sql`SELECT id FROM customers WHERE email = ${username}`;
        const customerId = rows[0]?.id as string | undefined;
        if (!customerId) throw new Error('No account found for that email');

        await issueVerificationCode(customerId, username);
    },

    async confirmSignup(username: string, code: string) {
        const customers = await sql`SELECT id FROM customers WHERE email = ${username}`;
        const customerId = customers[0]?.id as string | undefined;
        if (!customerId) throw new Error('No account found for that email');

        const rows = await sql`
            SELECT code, code_expires_at FROM email_verifications WHERE customer_id = ${customerId}`;
        const record = rows[0];

        const expired = !record?.code_expires_at || new Date(record.code_expires_at as string) < new Date();
        if (!record || record.code !== code || expired) {
            throw new Error('Invalid or expired confirmation code');
        }

        await sql`
            UPDATE email_verifications SET verified = true, code = null, code_expires_at = null
            WHERE customer_id = ${customerId}`;
    },

    async login(username: string, password: string, cookies: Cookies) {
        const rows = await sql`SELECT * FROM customers WHERE email = ${username}`;
        const customer = rows[0];
        if (!customer) return {ok: false};

        const passwordOk = await verifyPassword(password, customer.password as string);
        if (!passwordOk) return {ok: false};

        const verification = await sql`SELECT verified FROM email_verifications WHERE customer_id = ${customer.id}`;
        if (!verification[0]?.verified) {
            return {ok: false, challengeName: 'UNCONFIRMED'};
        }

        const token = await createSession(customer.id as string);
        setSessionCookie(cookies, TOKEN_COOKIE, token);
        setSessionCookie(cookies, ACCESS_TOKEN_COOKIE, token);

        return {
            ok: true,
            user: {
                id: customer.id as string,
                email: customer.email as string,
                firstName: (customer.first_name as string | null) ?? undefined,
                lastName: customer.last_name as string,
                phoneNumber: customer.phone_number as string
            }
        };
    },

    async logout(cookies: Cookies) {
        const token = cookies.get(TOKEN_COOKIE);
        if (token) {
            await sql`DELETE FROM sessions WHERE token = ${token}`;
        }
        cookies.delete(TOKEN_COOKIE, {path: '/'});
        cookies.delete(ACCESS_TOKEN_COOKIE, {path: '/'});
    },

    async verifySession(cookies: Cookies) {
        const token = cookies.get(TOKEN_COOKIE);
        if (!token) return null;

        const customerId = await getSessionCustomerId(token);
        if (!customerId) {
            // Expired or invalid session — clear the cookie and treat as logged out
            // rather than surfacing an error to the user.
            cookies.delete(TOKEN_COOKIE, {path: '/'});
            return null;
        }

        const rows = await sql`SELECT id, email FROM customers WHERE id = ${customerId}`;
        const customer = rows[0];
        if (!customer) return null;

        return {id: customer.id as string, email: customer.email as string};
    },

    async changePassword(accessToken: string, oldPassword: string, newPassword: string) {
        const customerId = await getSessionCustomerId(accessToken);
        if (!customerId) return {ok: false, errorText: 'Your session has expired — please log in again'};

        const rows = await sql`SELECT password FROM customers WHERE id = ${customerId}`;
        const customer = rows[0];
        if (!customer) return {ok: false, errorText: 'Account not found'};

        const passwordOk = await verifyPassword(oldPassword, customer.password as string);
        if (!passwordOk) return {ok: false, errorText: 'Current password is incorrect'};

        const newHash = await hashPassword(newPassword);
        await sql`UPDATE customers SET password = ${newHash} WHERE id = ${customerId}`;

        return {ok: true};
    }
};
