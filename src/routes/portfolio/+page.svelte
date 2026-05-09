<script lang="ts">
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
    const { pairs } = data;

    let current = $state(0);
    let videoEls: (HTMLVideoElement | null)[] = [];
    let videoStates = $state(pairs.map(() => ({ paused: true, progress: 0 })));

    function prev() { current = (current - 1 + pairs.length) % pairs.length; }
    function next() { current = (current + 1) % pairs.length; }

    function onKeydown(e: KeyboardEvent) {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
    }

    function togglePlay(i: number) {
        // Mouse events handle play/pause on hover-capable devices — skip click there
        if (window.matchMedia('(hover: hover)').matches) return;
        const video = videoEls[i];
        if (!video) return;
        if (video.paused) {
            video.play();
            videoStates[i].paused = false;
        } else {
            video.pause();
            videoStates[i].paused = true;
        }
    }

    function onTimeUpdate(i: number, e: Event) {
        const video = e.currentTarget as HTMLVideoElement;
        if (video.duration) {
            videoStates[i].progress = (video.currentTime / video.duration) * 100;
        }
    }

    function onSeek(i: number, e: Event) {
        const video = videoEls[i];
        if (!video || !video.duration) return;
        const pct = Number((e.currentTarget as HTMLInputElement).value);
        video.currentTime = (pct / 100) * video.duration;
        videoStates[i].progress = pct;
    }
</script>

<svelte:head>
    <title>Before &amp; After</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

<section class="showcase">
    <div class="section-title">Results</div>

    <div class="carousel">
        <button class="arrow" onclick={prev} aria-label="Previous">
            <i class="fa-solid fa-chevron-left"></i>
        </button>

        <div class="track-wrap">
            <div class="track" style="transform: translateX(-{current * 100}%)">
                {#each pairs as pair, i}
                    <div class="slide">
                        <div class="video-wrap">
                            <video
                                bind:this={videoEls[i]}
                                src={pair.video}
                                muted loop playsinline
                                onclick={() => togglePlay(i)}
                                onmouseenter={e => { e.currentTarget.play(); videoStates[i].paused = false; }}
                                onmouseleave={e => { e.currentTarget.pause(); videoStates[i].paused = true; }}
                                ontimeupdate={e => onTimeUpdate(i, e)}
                            ></video>

                            <div class="play-icon" class:visible={videoStates[i].paused}>
                                <i class="fa-solid fa-play"></i>
                            </div>

                            {#if pair.services}
                                <span class="services-label">{pair.services}</span>
                            {/if}

                            <input
                                type="range"
                                class="progress-bar"
                                min="0" max="100" step="0.1"
                                value={videoStates[i].progress}
                                oninput={e => onSeek(i, e)}
                                aria-label="Video progress"
                            />
                        </div>
                    </div>
                {/each}
            </div>
        </div>

        <button class="arrow" onclick={next} aria-label="Next">
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    </div>

    <div class="dots">
        {#each pairs as _, i}
            <button
                class="dot"
                class:active={i === current}
                onclick={() => current = i}
                aria-label="Go to slide {i + 1}"
            ></button>
        {/each}
    </div>
</section>

<style>
    .showcase {
        max-width: 820px;
        height: calc(100dvh - 340px);
        margin: 0 auto;
        padding: 0 1rem;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .carousel {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .track-wrap {
        flex: 1;
        min-height: 0;
        height: 100%;
        overflow: hidden;
        border-radius: var(--border-radius);
    }

    .track {
        display: flex;
        height: 100%;
        transition: transform 300ms ease;
    }

    .slide {
        min-width: 100%;
        height: 100%;
    }

    .video-wrap {
        position: relative;
        height: 100%;
        border: 1px solid var(--modal-border);
        border-radius: var(--border-radius);
        overflow: hidden;
        background: var(--modal-item-bg);
    }

    video {
        display: block;
        height: 100%;
        width: auto;
        max-width: 100%;
        margin: 0 auto;
        object-fit: contain;
        cursor: pointer;
    }

    /* Mobile-only play icon — hidden on devices that support hover (desktop) */
    .play-icon {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        font-size: 3rem;
        color: rgba(255, 255, 255, 0.9);
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: opacity 200ms ease;
    }

    @media (hover: none) {
        .play-icon.visible {
            opacity: 1;
        }
    }

    .services-label {
        position: absolute;
        bottom: 1.8rem;
        left: 0.6rem;
        right: 0.6rem;
        padding: 4px 10px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: color-mix(in srgb, var(--modal-bg) 70%, transparent);
        border: 1px solid var(--modal-border);
        border-radius: var(--border-radius);
    }

    /* Progress bar — overlaid at bottom of video */
    .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 20px !important;
        padding: 0 !important;
        margin: 0;
        border: none !important;
        box-shadow: none !important;
        background: transparent;
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        border-radius: 0 !important;
    }

    .progress-bar::-webkit-slider-runnable-track {
        height: 3px;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 2px;
    }

    .progress-bar::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: #ffffff;
        margin-top: -5px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    .progress-bar::-moz-range-track {
        height: 3px;
        background: rgba(255, 255, 255, 0.35);
        border-radius: 2px;
    }

    .progress-bar::-moz-range-thumb {
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: #ffffff;
        border: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    .arrow {
        flex: 0 0 auto;
        width: 2rem;
        height: 2rem;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--btn-bg);
        border: none;
        border-radius: 50%;
        box-shadow: none;
        font-size: 0.7rem;
        cursor: pointer;
        transition: opacity 160ms ease;
    }

    .arrow:hover { opacity: 0.75; }

    .dots {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }

    .dot {
        width: 6px;
        height: 6px;
        padding: 0;
        border: none;
        border-radius: 50%;
        box-shadow: none;
        background: var(--modal-border);
        cursor: pointer;
        transition: background 160ms ease;
    }

    .dot.active {
        background: var(--btn-bg);
    }
</style>