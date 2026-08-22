export interface Review {
    authorName: string;
    authorPhotoUri: string | null;
    rating: number;
    text: string | null;
    relativePublishTime: string;
    publishTime: string;
}

export interface PlaceReviews {
    rating: number;
    userRatingCount: number;
    reviews: Review[];
    googleMapsUri: string;
}

// Same rationale as the data Repository interface (see docs/interfaces.md): the rest of
// the app has no dependency on Google specifically, so a different reviews source (Yelp,
// a manual/curated list, etc.) can be swapped in by adding a sibling implementation and
// changing the one import in index.ts.
export interface ReviewsProvider {
    // Returns null (never throws) when reviews aren't available — unconfigured, rate
    // limited, or the API is down — so the page can fall back to a link-out CTA instead
    // of erroring.
    getPlaceReviews(): Promise<PlaceReviews | null>;
}

export interface CachedReviewsEntry {
    // null on the very first-ever fetch, when the row has been claimed (see touch())
    // but no successful payload has landed yet.
    data: PlaceReviews | null;
    fetchedAt: number;
}

// Backs the caching AOP proxy (withCache.ts). Same interface-per-external-dependency
// rationale as ReviewsProvider above — DynamoDB is one possible backing store, not the
// only one.
export interface ReviewsCacheStore {
    // Returns null only if no row exists yet — otherwise returns the entry regardless
    // of age, so withCache.ts can decide staleness and fall back to serving it if a
    // refresh attempt fails.
    get(): Promise<CachedReviewsEntry | null>;
    // Stamps fetchedAt = now without touching the payload. Called right before making
    // the paid API call, so a concurrent request that reads the cache a moment later
    // sees a fresh entry and skips its own call — see withCache.ts.
    touch(): Promise<void>;
    set(data: PlaceReviews): Promise<void>;
}
