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

// Same rationale as DomainRepository (see docs/interfaces.md): the rest of the app has
// no dependency on Google specifically, so a different reviews source (Yelp, a
// manual/curated list, etc.) can be swapped in by adding a sibling implementation and
// changing the one import in reviews/index.ts.
export interface ReviewsProvider {
    // Returns null (never throws) when reviews aren't available — unconfigured, rate
    // limited, or the API is down — so the page can fall back to a link-out CTA instead
    // of erroring.
    getPlaceReviews(): Promise<PlaceReviews | null>;
}
