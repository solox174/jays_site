import {GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID} from '$env/static/private';

// $env/static/private, not /dynamic/private: Amplify Hosting's Console-configured
// env vars/secrets are only ever available during the build (they're pulled into the
// CodeBuild container, confirmed via CloudWatch logs and `aws amplify get-app`) — they
// never reach the deployed compute's runtime process.env for this third-party adapter.
// Static env is read at build time and inlined into the compiled output, which is the
// one point where these values are actually present.
//
// Tradeoff: this makes both vars required at build time, in every environment
// (including local dev) — set them in .env / .env.local or the build fails.
export const reviewsConfig = {
    apiKey: GOOGLE_PLACES_API_KEY ?? '',
    placeId: GOOGLE_PLACE_ID ?? ''
};

export function reviewsConfigured(): boolean {
    return Boolean(reviewsConfig.apiKey && reviewsConfig.placeId);
}
