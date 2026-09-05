import type {Handler} from 'aws-lambda';
import {
    CognitoIdentityProviderClient,
    ListUsersCommand,
    AdminDeleteUserCommand,
    type UserType
} from '@aws-sdk/client-cognito-identity-provider';

// Plain console, not $lib/server/logger — that logger's DEV branch reads
// import.meta.env.DEV, a Vite-only macro. Amplify functions are bundled directly via
// esbuild (CDK's NodejsFunction), with no Vite involved, so import.meta.env is
// undefined there and that top-level read would throw before this handler ever runs.
// console output already reliably reaches CloudWatch for this kind of short-lived
// invocation (verified this session for the SSR compute Lambda — same platform).
const client = new CognitoIdentityProviderClient({});

async function listUnconfirmedUsers(userPoolId: string): Promise<UserType[]> {
    const users: UserType[] = [];
    let paginationToken: string | undefined;

    do {
        const result = await client.send(new ListUsersCommand({
            UserPoolId: userPoolId,
            Filter: 'cognito:user_status = "UNCONFIRMED"',
            PaginationToken: paginationToken
        }));
        users.push(...(result.Users ?? []));
        paginationToken = result.PaginationToken;
    } while (paginationToken);

    return users;
}

export const handler: Handler = async (event) => {
    const userPoolId = process.env.USER_POOL_ID;
    if (!userPoolId) {
        console.error('USER_POOL_ID is not set — is this function wired up correctly in backend.ts?');
        return {statusCode: 500, body: JSON.stringify('USER_POOL_ID is not set')};
    }

    const days = Number(process.env.CLEANUP_AGE_DAYS ?? '7');
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    console.log(`User cleanup running — deleting UNCONFIRMED users created before ${cutoff.toISOString()} (older than ${days} day(s))`, event);

    let deleted = 0;
    try {
        const unconfirmed = await listUnconfirmedUsers(userPoolId);
        const stale = unconfirmed.filter(u => u.UserCreateDate && u.UserCreateDate < cutoff);

        console.log(`Found ${unconfirmed.length} unconfirmed user(s) total, ${stale.length} older than the cutoff.`);

        for (const user of stale) {
            if (!user.Username) continue;
            try {
                await client.send(new AdminDeleteUserCommand({UserPoolId: userPoolId, Username: user.Username}));
                deleted++;
            } catch (e) {
                console.error(`Failed to delete user ${user.Username}:`, e);
            }
        }
    } catch (e) {
        console.error('User cleanup failed:', e);
        return {statusCode: 500, body: JSON.stringify('User cleanup failed')};
    }

    console.log(`User cleanup done — deleted ${deleted} user(s).`);

    return {
        statusCode: 200,
        body: JSON.stringify(`User cleanup done. Deleted ${deleted} user(s).`)
    };
};
