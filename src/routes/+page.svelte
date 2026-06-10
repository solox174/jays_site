<script lang="ts">
    import working from '$lib/assets/images/working.jpeg';

    const IMAGE_TOP = 87;    // visual top of image (px from scroll region top)
    const TEXT_WRAP_TOP = 72; // where text starts wrapping (spacer base height)
    let spacerEl: HTMLElement;

    function attachListeners(el: HTMLElement) {
        const contentEl = el.querySelector('#scroll-content') as HTMLElement;
        let startY = 0;
        let currentScrollY = 0;

        function applyScroll() {
            const maxScroll = Math.max(0, contentEl.scrollHeight - el.clientHeight);
            currentScrollY = Math.max(0, Math.min(currentScrollY, maxScroll));
            contentEl.style.transform = `translate3d(0, ${-currentScrollY}px, 0)`;
            spacerEl.style.height = `${TEXT_WRAP_TOP + currentScrollY}px`;
        }

        const onWheel = (e: WheelEvent) => { e.preventDefault(); currentScrollY += e.deltaY; applyScroll(); };
        const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            e.preventDefault();
            currentScrollY += startY - e.touches[0].clientY;
            startY = e.touches[0].clientY;
            applyScroll();
        };
        const onResize = () => applyScroll();

        requestAnimationFrame(applyScroll);
        window.addEventListener('resize', onResize);
        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });

        return {
            destroy() {
                window.removeEventListener('resize', onResize);
                el.removeEventListener('wheel', onWheel);
                el.removeEventListener('touchstart', onTouchStart);
                el.removeEventListener('touchmove', onTouchMove);
            }
        };
    }
</script>

<div class="glass-panel"
     style="display: flex; flex-direction: column; height: 100%;">
    <div use:attachListeners
         style="overflow: hidden; flex: 1 1 0; min-height: 0; touch-action: none; position: relative;">
        <img alt="working"
             src={working}
             style="position: absolute; top: {IMAGE_TOP}px; right: 0; width: var(--cta-image-width); aspect-ratio: 471 / 831; display: block; border-radius: var(--border-radius);"/>

        <div id="scroll-content" style="will-change: transform;">
            <div bind:this={spacerEl}
                 style="float: right; width: 0;"></div>
            <div style="float: right; clear: right; width: var(--cta-image-width); aspect-ratio: 471 / 831; visibility: hidden; margin-left: 12px;"></div>
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
