import {GOOGLE_MAPS_LISTING_URL as ENV_GOOGLE_MAPS_LISTING_URL} from '$env/static/private';

// Public Google Business Profile listing. Not a secret — safe to ship to the client —
// unlike the Place ID/API key used for live review fetching, which stay server-side
// (see $lib/server/reviews/config.ts). Read via $env/static/private (not public) purely
// because this module is only ever imported from server-side code (reviews/+page.server.ts);
// the resulting URL is what actually reaches the client, not this module itself.
export const GOOGLE_MAPS_LISTING_URL = ENV_GOOGLE_MAPS_LISTING_URL;

// Deep-links straight to the review composer instead of the general listing page.
export function googleWriteReviewUrl(placeId: string): string {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

// Deep-links straight to the full reviews list instead of the general listing page.
export function googleReviewsListUrl(placeId: string): string {
    return `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}`;
}
