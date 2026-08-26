import {sql} from './db';
import type {CachedReviewsEntry, ReviewsCacheStore} from '../types';
import type {PlaceReviews} from '$lib/server/api/types';

// Single fixed row — there's only ever one business's reviews to cache. Mirrors
// amplify/reviewsCacheStore.ts's shape.
const CACHE_ID = 'google-reviews';

export const postgresReviewsCacheStore: ReviewsCacheStore = {
    async get(): Promise<CachedReviewsEntry | null> {
        const rows = await sql`SELECT * FROM google_reviews_cache WHERE id = ${CACHE_ID}`;
        const row = rows[0];
        if (!row) return null;

        let parsed: PlaceReviews | null = null;
        try {
            parsed = row.payload ? JSON.parse(row.payload as string) : null;
        } catch {
            parsed = null;
        }

        return {data: parsed, fetchedAt: new Date(row.fetched_at as string).getTime()};
    },

    async touch(): Promise<void> {
        await sql`
            INSERT INTO google_reviews_cache (id, payload, fetched_at)
            VALUES (${CACHE_ID}, '', now())
            ON CONFLICT (id) DO UPDATE SET fetched_at = now()`;
    },

    async set(placeReviews: PlaceReviews): Promise<void> {
        await sql`
            INSERT INTO google_reviews_cache (id, payload, fetched_at)
            VALUES (${CACHE_ID}, ${JSON.stringify(placeReviews)}, now())
            ON CONFLICT (id) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`;
    }
};
