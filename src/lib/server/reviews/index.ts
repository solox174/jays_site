// The provider (Google Places API) is platform-agnostic — it's a plain fetch to
// Google, same regardless of hosting platform — so unlike storage/index.ts, there's
// nothing to select here; the cache store it's wrapped with is already the
// platform-selected one from storage/index.ts.
import {googleReviewsProvider} from '$lib/server/api/googleReviewsProvider';
import {reviewsCacheStore} from '$lib/server/storage';
import {withCache} from '$lib/server/storage/withCache';
import {logger} from '$lib/server/logger';
import type {PlaceReviews, ReviewsProvider} from '$lib/server/api/types';

const cachedProvider = withCache(googleReviewsProvider, reviewsCacheStore);

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
