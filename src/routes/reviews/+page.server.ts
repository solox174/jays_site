import type {PageServerLoad} from './$types';
import {reviewsProvider} from '$lib/server/reviews';
import {reviewsConfig} from '$lib/server/reviews/config';
import {GOOGLE_MAPS_LISTING_URL, googleWriteReviewUrl} from '$lib/googleBusiness';

export const load: PageServerLoad = async () => {
    const placeReviews = await reviewsProvider.getPlaceReviews();

    return {
        placeReviews,
        writeReviewUrl: reviewsConfig.placeId
            ? googleWriteReviewUrl(reviewsConfig.placeId)
            : GOOGLE_MAPS_LISTING_URL,
        listingUrl: GOOGLE_MAPS_LISTING_URL
    };
};
