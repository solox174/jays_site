<script lang="ts">
    import type {PageProps} from './$types';

    let {data}: PageProps = $props();
    const {placeReviews, writeReviewUrl, listingUrl} = data;

    function starClass(position: number, rating: number): string {
        if (rating >= position) return 'fa-solid fa-star';
        if (rating >= position - 0.5) return 'fa-solid fa-star-half-stroke';
        return 'fa-regular fa-star';
    }
</script>

<svelte:head>
    <title>Reviews</title>
</svelte:head>

<div class="glass-panel reviews-page" style="height: 100%; display: flex; flex-direction: column;">
    <div class="reviews-header">
        <h1>Customer Reviews</h1>

        {#if placeReviews}
            <div class="rating-summary">
                <span class="rating-number">{placeReviews.rating.toFixed(1)}</span>
                <div class="stars" aria-label="{placeReviews.rating} out of 5 stars">
                    {#each [1, 2, 3, 4, 5] as position}
                        <i class={starClass(position, placeReviews.rating)}></i>
                    {/each}
                </div>
                <span class="rating-count">({placeReviews.userRatingCount} reviews)</span>
            </div>
        {/if}

        <div class="cta-row">
            <a class="btn-primary" href={writeReviewUrl} target="_blank" rel="noopener noreferrer">
                <i class="fa-solid fa-pen-to-square"></i> Leave a Review
            </a>
            <a class="btn-secondary" href={listingUrl} target="_blank" rel="noopener noreferrer">
                See All Reviews on Google
            </a>
        </div>
    </div>

    {#if placeReviews && placeReviews.reviews.length > 0}
        <div class="review-list">
            {#each placeReviews.reviews as review}
                <div class="review-card">
                    <div class="review-card-header">
                        {#if review.authorPhotoUri}
                            <img class="avatar" src={review.authorPhotoUri} alt="" referrerpolicy="no-referrer"/>
                        {:else}
                            <div class="avatar avatar-fallback"><i class="fa-solid fa-user"></i></div>
                        {/if}
                        <div>
                            <div class="author-name">{review.authorName}</div>
                            <div class="stars small" aria-label="{review.rating} out of 5 stars">
                                {#each [1, 2, 3, 4, 5] as position}
                                    <i class={starClass(position, review.rating)}></i>
                                {/each}
                            </div>
                        </div>
                        <span class="relative-time">{review.relativePublishTime}</span>
                    </div>
                    {#if review.text}
                        <p class="review-text">{review.text}</p>
                    {/if}
                </div>
            {/each}
        </div>

        <p class="google-attribution" style="text-align: center; margin-top: auto; padding-top:7px">
            <i class="fa-brands fa-google"></i> Reviews provided by Google
        </p>
    {:else}
        <p class="empty-state">
            Read what our customers are saying, or share your own experience — both open
            in Google.
        </p>
    {/if}
</div>

<style>
    .reviews-page {
        max-width: 600px;
        width: 100%;
        margin: 0 auto;
        padding: 20px;
        box-sizing: border-box;
    }

    .reviews-header {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .reviews-header h1 {
        margin-bottom: 0.5rem;
    }

    .rating-summary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .rating-number {
        font-size: 1.5rem;
        font-weight: 600;
    }

    .stars {
        color: var(--brand-color);
        font-size: 1.1rem;
    }

    .stars.small {
        font-size: 0.8rem;
    }

    .rating-count {
        color: var(--label-color);
        font-size: 0.9rem;
    }

    .cta-row {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
    }

    .btn-primary {
        background: var(--action-bg);
        color: white;
        padding: 0.6rem 1.1rem;
        border-radius: var(--border-radius);
        font-weight: 600;
    }

    .btn-primary:hover {
        text-decoration: none;
        opacity: 0.9;
    }

    .btn-secondary {
        background: var(--item-bg);
        color: inherit;
        padding: 0.6rem 1.1rem;
        border-radius: var(--border-radius);
        border: 1px solid var(--overlay-border);
        font-weight: 500;
    }

    .btn-secondary:hover {
        background: var(--item-bg-hover);
        text-decoration: none;
    }

    .review-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
    }

    .review-card {
        background: var(--item-bg);
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        padding: 1rem;
    }

    .review-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .avatar-fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--item-bg-hover);
        color: var(--label-color);
    }

    .author-name {
        font-weight: 600;
    }

    .relative-time {
        margin-left: auto;
        color: var(--label-color);
        font-size: 0.85rem;
        white-space: nowrap;
    }

    .review-text {
        margin: 0.75rem 0 0;
        color: var(--label-color);
    }

    .google-attribution {
        text-align: center;
        color: var(--label-color);
        font-size: 0.8rem;
        margin-top: 1.5rem;
    }

    .empty-state {
        text-align: center;
        color: var(--label-color);
    }
</style>
