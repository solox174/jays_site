// To swap review sources: replace this import with a different implementation
// (e.g. './yelp/yelpReviewsProvider') — no other files need to change.
import {googleReviewsProvider} from './google/googleReviewsProvider';
import {dynamoDbReviewsCacheStore} from './dynamodb/reviewsCacheStore';
import {withCache} from './withCache';
import {logger} from '$lib/server/logger';
import type {PlaceReviews, ReviewsProvider} from './types';

const cachedProvider = withCache(googleReviewsProvider, dynamoDbReviewsCacheStore);

// Reviews are a nice-to-have, not critical path — never let a provider failure break
// the page, so failures are swallowed here (and logged) rather than propagated like
// the data Repository layer does.
export const reviewsProvider: ReviewsProvider = {
    async getPlaceReviews(): Promise<PlaceReviews | null> {
        try {
            return await cachedProvider.getPlaceReviews();
        } catch (e) {
            logger.error(`reviewsProvider.getPlaceReviews failed: ${e}`);
            return null;
        }
    }
};
