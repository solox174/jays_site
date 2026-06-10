<script lang="ts">
    import working from '$lib/assets/images/working.jpeg';
    import { pinnedFloatScroll } from '$lib/pinned-float-scroll';

    function attach(viewport: HTMLElement) {
        const pinned = viewport.querySelector('[data-pfs-pinned]') as HTMLElement;
        const content = viewport.querySelector('[data-pfs-content]') as HTMLElement;
        return pinnedFloatScroll(viewport, pinned, content, {
            pinnedWidth: 'var(--cta-image-width)',
            pinnedAspectRatio: '471/831',
        });
    }
</script>

<div class="glass-panel"
     style="display: flex; flex-direction: column">
    <div use:attach
         style="flex: 1 1 0; min-height: 0;">
        <img data-pfs-pinned
             alt="working"
             src={working}
             style="width: var(--cta-image-width); aspect-ratio: 471 / 831; display: block; border-radius: var(--border-radius);"/>

        <div data-pfs-content>
            <p>
                Your car is a major investment. Daily driving takes a toll on its appearance and value. Standard car
                washes often leave scratches and miss hidden dirt. We restore your vehicle to showroom condition. Our
                professional detailing preserves your paint, deep-cleans your interior, and protects your investment.
                <br/><br/>
                Experienced Professionals: Trained detailers who treat your car like their own. Premium Products: We use
                only high-end, eco-friendly cleaning formulas. Attention to Detail: No crevice, vent, or seam is left
                untouched. Convenient Scheduling: Flexible booking times to fit your busy lifestyle.
            </p>
        </div>
    </div>

    <div style="margin-top: 20px">
        A few examples of the finishes we deliver across a range of vehicle conditions.
    </div>

    <a href="/portfolio">
        <button style="margin-top: 10px;">Results</button>
    </a>
</div>

<style>
    .glass-panel {
        height: 90%;
    }
    /** mobile **/
    @media (max-width: 640px) {
        .glass-panel {
            height: 100%;
        }
    }
</style>