import { defineFunction } from '@aws-amplify/backend';

// Deletes Cognito users stuck in UNCONFIRMED status (never completed signup — mostly
// bot/scraper noise on the create-account form, see scripts/cleanupUnconfirmedUsers.ts
// for the one-off/manual version of the same logic) older than CLEANUP_AGE_DAYS.
// USER_POOL_ID and the IAM permissions to call Cognito are granted in backend.ts, since
// they require a reference to the auth resource.
export const userCleanup = defineFunction({
    name: 'user-cleanup-cron',
    schedule: [
        // Every Sunday at midnight UTC
        '0 0 * * 0'
    ],
    environment: {
        CLEANUP_AGE_DAYS: '7'
    }
});
