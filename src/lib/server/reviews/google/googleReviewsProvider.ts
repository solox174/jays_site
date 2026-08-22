import {logger} from '$lib/server/logger';
import {reviewsConfig, reviewsConfigured} from '../config';
import type {PlaceReviews, Review, ReviewsProvider} from '../types';

// Places API (New) Place Details: https://developers.google.com/maps/documentation/places/web-service/place-details
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';
const FIELD_MASK = 'rating,userRatingCount,reviews,googleMapsUri';

// Response caching (Place Details is billed per call) lives in withCache.ts, applied at
// the assembly point in index.ts — this provider only knows how to talk to Google.

type GoogleReview = {
    rating: number;
    text?: {text: string};
    relativePublishTimeDescription: string;
    publishTime: string;
    authorAttribution?: {displayName: string; photoUri?: string};
};

type PlaceDetailsResponse = {
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    reviews?: GoogleReview[];
};

function toReview(r: GoogleReview): Review {
    return {
        authorName: r.authorAttribution?.displayName ?? 'Google user',
        authorPhotoUri: r.authorAttribution?.photoUri ?? null,
        rating: r.rating,
        text: r.text?.text ?? null,
        relativePublishTime: r.relativePublishTimeDescription,
        publishTime: r.publishTime
    };
}

export const googleReviewsProvider: ReviewsProvider = {
    async getPlaceReviews(): Promise<PlaceReviews | null> {
        if (!reviewsConfigured()) {
            // Never log the key/id values themselves — just whether each is present.
            logger.warn(
                `Google reviews not configured — apiKey present: ${Boolean(reviewsConfig.apiKey)}, placeId present: ${Boolean(reviewsConfig.placeId)}`
            );
            return null;
        }

        logger.info(`Fetching Google Place Details for placeId=${reviewsConfig.placeId}`);

        const response = await fetch(`${PLACE_DETAILS_URL}/${reviewsConfig.placeId}`, {
            headers: {
                'X-Goog-Api-Key': reviewsConfig.apiKey,
                'X-Goog-FieldMask': FIELD_MASK
            }
        });

        if (!response.ok) {
            logger.error(`Google Place Details fetch failed: ${response.status} ${await response.text()}`);
            return null;
        }

        const data: PlaceDetailsResponse = await response.json();

        logger.info(
            `Google Place Details fetched: rating=${data.rating}, userRatingCount=${data.userRatingCount}, reviews=${data.reviews?.length ?? 0}`
        );

        return {
            rating: data.rating ?? 0,
            userRatingCount: data.userRatingCount ?? 0,
            reviews: (data.reviews ?? []).map(toReview),
            googleMapsUri: data.googleMapsUri ?? ''
        };
    }
};
