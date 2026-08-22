import {logger} from '$lib/server/logger';
import type {CachedReviewsEntry, PlaceReviews, ReviewsCacheStore, ReviewsProvider} from './types';

// Caps calls to the paid Google API at roughly once per day, regardless of traffic.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// AOP proxy (same rationale as repository/withLogging.ts): caching is a cross-cutting
// concern applied at the assembly point, so googleReviewsProvider stays focused on
// talking to Google and doesn't need to know a cache exists.
//
// A cache failure (store unreachable, table not deployed yet, etc.) degrades to calling
// the provider directly rather than breaking the page — it just means Google gets billed
// for that request.
export function withCache(provider: ReviewsProvider, cacheStore: ReviewsCacheStore): ReviewsProvider {
    return {
        async getPlaceReviews(): Promise<PlaceReviews | null> {
            let entry: CachedReviewsEntry | null = null;
            try {
                entry = await cacheStore.get();
            } catch (e) {
                logger.error(`ReviewsCacheStore.get failed: ${e}`);
            }

            const isFresh = entry !== null && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
            if (isFresh && entry?.data) return entry.data;

            // Stale, missing, or first run: claim the refresh slot immediately by
            // stamping the timestamp before calling Google. Any request that reads the
            // cache in the next few seconds then sees a fresh entry and skips its own
            // (paid) call — a best-effort way to collapse a burst of near-simultaneous
            // requests into a single daily pull, not a strict distributed lock.
            try {
                await cacheStore.touch();
            } catch (e) {
                logger.error(`ReviewsCacheStore.touch failed: ${e}`);
            }

            const fresh = await provider.getPlaceReviews();

            if (fresh) {
                try {
                    await cacheStore.set(fresh);
                } catch (e) {
                    logger.error(`ReviewsCacheStore.set failed: ${e}`);
                }
                return fresh;
            }

            // Google call failed — serve stale cached data rather than nothing.
            return entry?.data ?? null;
        }
    };
}
