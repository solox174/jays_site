<script lang="ts">
    import type {PageProps} from './$types';
    import {onMount} from "svelte";

    let {data}: PageProps = $props();
    // svelte-ignore state_referenced_locally
    const {pairs} = data;

    let current = $state(0);
    let videoEls: (HTMLVideoElement | null)[] = [];
    let carousel: HTMLDivElement;
    let videoStates = $state(pairs.map(() => ({paused: true, progress: 0})));

    function prev() {
        current = (current - 1 + pairs.length) % pairs.length;
    }

    function next() {
        current = (current + 1) % pairs.length;
    }

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

    function videoMax() {
        carousel.requestFullscreen();
    }

    onMount(() => {
     for(const video of videoEls) {
         let lastTap = 0;
         const doubleTapDelay = 300;
         video?.addEventListener('touchend', async (event) => {
             const now = Date.now();
             const timeSinceLastTap = now - lastTap;

             if (timeSinceLastTap > 0 && timeSinceLastTap < doubleTapDelay) {
                 event.preventDefault();
                 videoMax();
                 lastTap = 0;
                 return;
             }

             lastTap = now;
         }, { passive: false });
     }
    });
</script>

<svelte:head>
    <title>Before &amp; After</title>
</svelte:head>

<svelte:window onkeydown={onKeydown}/>

<div class="glass-panel" style="display: flex; flex-direction: column; height:0; flex-grow:1; padding: 40px 0">
    <section class="showcase">
        <div bind:this={carousel} class="carousel" style="max-width: 500px">
            <button aria-label="Previous" class="arrow" onclick={prev}>
                <i class="fa-solid fa-chevron-left"></i>
            </button>

            <div class="track-wrap">
                <div class="track" style="transform: translateX(-{current * 100}%)">
                    {#each pairs as pair, i}
                        <div class="slide">
                            <div class="video-wrap">
                                <video bind:this={videoEls[i]}
                                       src={pair.video}
                                       muted loop playsinline
                                       onclick={() => togglePlay(i)}
                                       onmouseenter={e => { e.currentTarget.play(); videoStates[i].paused = false; }}
                                       onmouseleave={e => { e.currentTarget.pause(); videoStates[i].paused = true; }}
                                       ontimeupdate={e => onTimeUpdate(i, e)} >
                                </video>

                                <div class="play-icon" class:visible={videoStates[i].paused}>
                                    <i class="fa-solid fa-play"></i>
                                </div>

                                {#if pair.services}
                                <span class="services-label">{pair.services}</span>
                                {/if}

                                <input type="range"
                                       class="progress-bar"
                                       min="0" max="100" step="0.1"
                                       value={videoStates[i].progress}
                                       oninput={e => onSeek(i, e)}
                                       aria-label="Video progress" />
                            </div>
                        </div>
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <i onclick="{videoMax}" role="button" tabindex="0" class="fa-solid fa-up-right-and-down-left-from-center"
                           style="position: absolute; bottom: 10px; right: 7px; font-size: 1.3rem"></i>
                    {/each}
                </div>
            </div>

            <button aria-label="Next" class="arrow" onclick={next}>
                <i class="fa-solid fa-chevron-right"></i>
            </button>
        </div>

        <div class="dots">
            {#each pairs as _, i}
                <button class="dot"
                        class:active={i === current}
                        onclick={() => current = i}
                        aria-label="Go to slide {i + 1}">
                </button>
            {/each}
        </div>
    </section>
</div>

<style>
    .showcase {
        max-width: 820px;
        flex: 1;
        min-height: 0;
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

    .carousel:fullscreen {
        height: 100vh;
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
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
        overflow: hidden;
        background: var(--item-bg);
        padding-top: 6px;
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
        bottom: 2.70rem; /* must clear progress-bar height (40px) + gap */
        left: 0.6rem;
        right: 0.6rem;
        padding: 4px 10px;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: color-mix(in srgb, var(--surface-overlay) 70%, transparent);
        border: 1px solid var(--overlay-border);
        border-radius: var(--border-radius);
    }

    /* Progress bar — overlaid at bottom of video */
    input.progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 40px !important;
        padding: 0 50px;
        margin: 0;
        border: none !important;
        box-shadow: none !important;
        box-sizing: border-box;
        background: var(--item-bg);
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none; /* required to override browser default before custom styles apply */
        border-radius: 0 !important;
    }

    /*
        No CSS standard yet for range track/thumb — ::slider-track / ::slider-thumb are proposed
        but unshipped. Recheck ~2027.
        -webkit- covers Chrome + Safari: Chrome's Blink engine is a 2013 fork of WebKit and still
        honors webkit prefixes for compatibility. -moz- covers Firefox. Neither vendor creates new
        prefixes anymore (experimental features use runtime flags instead), so this is legacy syntax
        we're stuck with until the standard lands.
     */

    .progress-bar::-webkit-slider-runnable-track {
        height: 3px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 2px;
    }

    .progress-bar::-webkit-slider-thumb {
        -webkit-appearance: none; /* required — without this the thumb ignores width/height */
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: var(--brand-color);
        margin-top: -5px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    .progress-bar::-moz-range-track {
        height: 3px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 2px;
    }

    .progress-bar::-moz-range-thumb {
        width: 13px;
        height: 13px;
        border-radius: 50%;
        background: var(--brand-color);
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
        background: var(--action-bg);
        border: none;
        border-radius: 50%;
        box-shadow: none;
        font-size: 0.7rem;
        cursor: pointer;
        transition: opacity 160ms ease;
    }

    .arrow:hover {
        opacity: 0.75;
    }

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
        background: var(--overlay-border);
        cursor: pointer;
        transition: background 160ms ease;
    }

    .dot.active {
        background: var(--action-bg);
    }
</style>