import {amplifyClient} from '$lib/client/amplifyClient';
import type {CachedReviewsEntry, PlaceReviews, ReviewsCacheStore} from '../types';

// Single fixed row — there's only ever one business's reviews to cache.
const CACHE_ID = 'google-reviews';

export const dynamoDbReviewsCacheStore: ReviewsCacheStore = {
    async get(): Promise<CachedReviewsEntry | null> {
        const {data} = await amplifyClient.models.GoogleReviewsCache.get({id: CACHE_ID});
        if (!data) return null;

        let parsed: PlaceReviews | null = null;
        try {
            parsed = data.payload ? JSON.parse(data.payload as string) : null;
        } catch {
            parsed = null;
        }

        return {data: parsed, fetchedAt: new Date(data.fetchedAt as string).getTime()};
    },

    async touch(): Promise<void> {
        const {data: existing} = await amplifyClient.models.GoogleReviewsCache.get({id: CACHE_ID});
        const fetchedAt = new Date().toISOString();

        if (existing) {
            await amplifyClient.models.GoogleReviewsCache.update({id: CACHE_ID, fetchedAt});
        } else {
            // No payload yet — leave it empty rather than omitting the required field.
            await amplifyClient.models.GoogleReviewsCache.create({id: CACHE_ID, payload: '', fetchedAt});
        }
    },

    async set(placeReviews: PlaceReviews): Promise<void> {
        await amplifyClient.models.GoogleReviewsCache.update({
            id: CACHE_ID,
            payload: JSON.stringify(placeReviews),
            fetchedAt: new Date().toISOString()
        });
    }
};
