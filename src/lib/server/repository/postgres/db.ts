import {neon, type NeonQueryFunction} from '@neondatabase/serverless';

// Plain process.env, not $env/static|dynamic/private — see platform.ts. Also lazy: this
// module gets imported unconditionally by repository/index.ts (both platform branches
// are statically imported so the selector can choose between them), so validating
// DATABASE_URL eagerly at import time would crash an AWS-platform deployment that never
// configured Postgres at all, even though it'd never actually call these repositories.
// Only throw once a query is actually attempted.
let client: NeonQueryFunction<false, false> | undefined;

function getClient(): NeonQueryFunction<false, false> {
    if (!client) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not set — are the Postgres repositories actually meant to be active here?');
        }
        client = neon(databaseUrl);
    }
    return client;
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
    return getClient()(strings, ...values);
}
