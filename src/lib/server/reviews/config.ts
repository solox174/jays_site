import {env} from '$env/dynamic/private';

// $env/dynamic/private (not /static/private) so the app still builds and runs before
// these are set — reviews just stay unconfigured until they are.
export const reviewsConfig = {
    apiKey: env.GOOGLE_PLACES_API_KEY ?? '',
    placeId: env.GOOGLE_PLACE_ID ?? ''
};

export function reviewsConfigured(): boolean {
    return Boolean(reviewsConfig.apiKey && reviewsConfig.placeId);
}
