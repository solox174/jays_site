// Public Google Business Profile listing for Jay's Auto Car Care. Not a secret — safe to
// ship to the client — unlike the Place ID/API key used for live review fetching, which
// stay server-side (see $lib/server/reviews/config.ts).
export const GOOGLE_MAPS_LISTING_URL = 'https://share.google/gq37l83AjcjP511tI';

// Deep-links straight to the review composer instead of the general listing page.
export function googleWriteReviewUrl(placeId: string): string {
    return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}
