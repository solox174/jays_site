/**
 * pinnedFloatScroll
 *
 * Pins an element in the top-right corner of a scroll viewport while body
 * text scrolls around it — text flows full-width for a configurable number
 * of lines, then wraps around the pinned element for the remainder.
 *
 * ## How it works
 *
 * Scrolling is JS-driven (CSS transform on the content div) rather than
 * native overflow scroll. This lets the pinned element sit outside the
 * scrolling content as position:absolute, so it never moves.
 *
 * Text wrapping is achieved with a "two-float ghost" system injected into
 * the content div:
 *
 *   [spacer]  float:right, width:0
 *             Height = textWrapTop + currentScrollY.
 *             Zero-width so it never constrains line boxes. Its only job is
 *             to push the ghost downward via clear:right. Height grows with
 *             scroll to counteract the content transform, keeping the ghost
 *             visually pinned to the same position as the real element.
 *
 *   [ghost]   float:right, clear:right, same width/height as pinned element
 *             Invisible (visibility:hidden). This is what the browser's
 *             line-box algorithm sees when deciding where to wrap text.
 *             Positioned by the spacer, not by margin-top — see note below.
 *
 * ## Why not margin-top on the ghost?
 *
 * CSS uses a float's *margin edge* (not its border edge) when determining
 * which line boxes to constrain. A float with margin-top:72px still narrows
 * line boxes from y=0. The margin just creates invisible dead space above
 * the visible float without freeing the text above it. Using spacer *height*
 * avoids this — actual block height creates real space that line boxes
 * respect.
 *
 * ## Why is maxScroll calculated only on mount/resize?
 *
 * Recalculating inside the scroll handler creates a feedback loop: updating
 * the spacer height triggers a layout reflow that changes scrollHeight, which
 * changes maxScroll, causing a one-frame bounce at the scroll boundary. A
 * stable maxScroll breaks the loop.
 */

/**
 * Configuration for a pinned-float-scroll instance.
 */
export interface PinnedFloatScrollOptions {
    /**
     * CSS width of the pinned element and its ghost float.
     * Accepts any valid CSS width value, including custom properties.
     * @example "140px"
     * @example "var(--cta-image-width)"
     */
    pinnedWidth: string;

    /**
     * Aspect ratio of the pinned element in "width/height" form.
     * Used to size the ghost float so it occupies the same space as the
     * pinned element when computing line-box wrapping.
     * @example "471/831"
     * @example "1/1"
     */
    pinnedAspectRatio: string;

    /**
     * Distance in px from the top of the viewport to the top of the pinned
     * element. Defaults to `textWrapTop + gap`, which aligns the image with
     * the ghost border edge and creates `gap` px of breathing room above it.
     */
    imageTop?: number;

    /**
     * Distance in px from the top of the scroll content to where text starts
     * wrapping around the pinned element. For a top gap matching `gap`, set
     * this to `imageTop + gap`. Text above this point renders at full width.
     * @default 72
     */
    textWrapTop?: number;

    /**
     * Horizontal gap in px between the text and the left edge of the pinned
     * element, applied as margin-left on the ghost float.
     * @default 9
     */
    gapLeft?: number;

    /**
     * Adjusts the breathing room around the pinned element from the default
     * 12 px. Positive values increase spacing; negative values decrease it.
     * Applied equally to both the top and bottom edges of the pinned element.
     * @default 0
     */
    gapAdjust?: number;

    /**
     * Height in px of the CSS mask-image gradient at the bottom of the
     * viewport, which signals to the user that content is scrollable.
     * Set to 0 to disable the fade.
     * @default 48
     */
    fadePx?: number;
}

/**
 * Handle returned by {@link pinnedFloatScroll}. Call destroy() to remove all
 * event listeners and injected DOM nodes when the component is torn down.
 */
export interface PinnedFloatScrollInstance {
    /** Remove event listeners and injected ghost floats. */
    destroy(): void;
}

/**
 * Initialise a pinned-float-scroll instance.
 *
 * Styles the viewport and pinned element, injects the ghost float system into
 * the content div, and wires up wheel, touch, and resize event handlers.
 *
 * The caller is responsible for:
 * - Giving the viewport a definite height (flex, explicit px, etc.)
 * - Placing the pinned element and content div as children of the viewport
 * - Calling destroy() when the instance is no longer needed
 *
 * @param viewport - Clipping container. Receives overflow:hidden and the
 *                   bottom-fade mask-image. Must have a definite height.
 * @param pinned   - Element to pin top-right. Already a child of viewport.
 *                   Receives position:absolute.
 * @param content  - Scrollable content container. Already a child of viewport.
 *                   Ghost floats are prepended here; transform is applied here.
 * @param options  - See {@link PinnedFloatScrollOptions}.
 * @returns        A handle with a destroy() method for cleanup.
 */
export function pinnedFloatScroll(
    viewport: HTMLElement,
    pinned: HTMLElement,
    content: HTMLElement,
    options: PinnedFloatScrollOptions
): PinnedFloatScrollInstance {
    const {
        pinnedWidth,
        pinnedAspectRatio,
        textWrapTop = 72,
        gapLeft = 9,
        gapAdjust = 0,
        fadePx = 48,
    } = options;
    const BASE_GAP = 12;
    const totalGap = Math.max(0, BASE_GAP + gapAdjust);
    const imageTop = options.imageTop ?? textWrapTop + totalGap;

    // Reset block-level margins inside content so they don't create unexpected
    // dead space that misaligns the ghost float with the visible text boundary.
    const scopedStyle = document.createElement('style');
    scopedStyle.textContent = '[data-pfs-content] > * { margin-top: 0; margin-bottom: 0; }';
    document.head.appendChild(scopedStyle);

    // Style viewport
    Object.assign(viewport.style, {
        overflow: 'hidden',
        position: 'relative',
        touchAction: 'none',
    });

    // Pin the element top-right
    Object.assign(pinned.style, {
        position: 'absolute',
        top: `${imageTop}px`,
        right: '0',
    });

    // maskWrapper receives the fade mask. content is reparented into it so the
    // pinned sibling (outside maskWrapper) is never clipped by the gradient.
    const maskWrapper = document.createElement('div');
    Object.assign(maskWrapper.style, {
        position: 'absolute',
        inset: '0',
        ...(fadePx > 0 && {
            maskImage: `linear-gradient(to bottom, black calc(100% - ${fadePx}px), transparent 100%)`,
            webkitMaskImage: `linear-gradient(to bottom, black calc(100% - ${fadePx}px), transparent 100%)`,
        }),
    });
    viewport.insertBefore(maskWrapper, content);
    maskWrapper.appendChild(content);

    // Promote content to its own compositor layer
    Object.assign(content.style, {
        willChange: 'transform',
        paddingBottom: `${fadePx + 8}px`,
    });

    // Spacer: zero-width float, height managed by applyScroll to keep the
    // ghost visually aligned with the pinned element as content translates.
    const spacer = document.createElement('div');
    Object.assign(spacer.style, {
        float: 'right',
        width: '0',
        height: `${textWrapTop}px`,
    });

    // Ghost: invisible float that defines the text-wrap exclusion zone.
    // clear:right places it below the spacer, i.e. at the pinned element's position.
    const ghost = document.createElement('div');
    Object.assign(ghost.style, {
        float: 'right',
        clear: 'right',
        width: pinnedWidth,
        aspectRatio: pinnedAspectRatio,
        visibility: 'hidden',
        marginLeft: `${gapLeft}px`,
        // topGap + bottomGap = totalGap + totalGap; topGap corrects for
        // the ghost/image y-offset, bottomGap creates the visible bottom gap.
        marginBottom: `${2 * totalGap}px`,
    });

    // Ghost must be prepended before spacer so DOM order is: spacer, ghost, user content
    content.prepend(ghost);
    content.prepend(spacer);

    // Scroll state
    let startY = 0;
    let currentScrollY = 0;
    let maxScroll = 0;

    function applyScroll(): void {
        currentScrollY = Math.max(0, Math.min(currentScrollY, maxScroll));
        content.style.transform = `translate3d(0, ${-currentScrollY}px, 0)`;
        // Grow spacer to counteract the content transform, keeping ghost aligned
        spacer.style.height = `${textWrapTop + currentScrollY}px`;
    }

    // maxScroll is calculated only on mount and resize — never inside scroll
    // handlers — to avoid a layout-reflow feedback loop at the scroll boundary.
    function recalc(): void {
        maxScroll = Math.max(0, content.scrollHeight - viewport.clientHeight);
        applyScroll();
    }

    const onWheel = (e: WheelEvent): void => {
        e.preventDefault();
        currentScrollY += e.deltaY;
        applyScroll();
    };

    const onTouchStart = (e: TouchEvent): void => {
        startY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent): void => {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        currentScrollY += startY - e.touches[0].clientY;
        startY = e.touches[0].clientY;
        applyScroll();
    };

    const onResize = (): void => recalc();

    requestAnimationFrame(recalc);
    window.addEventListener('resize', onResize);
    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });

    return {
        destroy() {
            window.removeEventListener('resize', onResize);
            viewport.removeEventListener('wheel', onWheel);
            viewport.removeEventListener('touchstart', onTouchStart);
            viewport.removeEventListener('touchmove', onTouchMove);
            spacer.remove();
            ghost.remove();
            scopedStyle.remove();
            maskWrapper.replaceWith(content);
        },
    };
}
