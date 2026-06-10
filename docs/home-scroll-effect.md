# Home Page Scroll Effect

The home page (`src/routes/+page.svelte`) uses `pinnedFloatScroll` from `src/lib/pinned-float-scroll.ts` — a framework-agnostic library — to achieve an unusual layout effect: a pinned image in the top-right corner while body text scrolls around it. See `docs/npm-publish-pinned-float-scroll.md` for the extraction path to a standalone npm package.

## The Goal

- Image stays fixed in the top-right of the glass panel
- Text scrolls independently
- Text wraps around the image as it scrolls (not just padded away from it)
- A few lines of full-width text appear above the image before wrapping begins
- "A few examples" caption and Results button are pinned at the bottom of the panel

## Why Not Native Scroll?

With `overflow-y: auto`, the float and image would scroll together. Separating them requires JS-driven transform scrolling so the image can be `position: absolute` (never moves) while the content div translates.

## Why Not `margin-top` on the Float?

The intuitive approach — give the ghost float a `margin-top` equal to the desired offset — doesn't work. CSS uses a float's **margin edge** (not its border edge) when determining which line boxes to constrain. A `margin-top: 72px` float still narrows line boxes from `y=0`, not `y=72`. The margin just creates invisible dead space above the visible float without freeing the text above it.

## The Two-Float Ghost System

Two invisible floats are injected by the library before the user's content inside the `[data-pfs-content]` div:

```
[data-pfs-content]
  ├── spacer  (float: right, width: 0,  height: textWrapTop + currentScrollY)
  ├── ghost   (float: right, clear: right, width/height = image dimensions)
  └── <p>     (body text)
```

**Spacer** — zero-width, so it never constrains any line boxes. Its height is the only thing that matters: it pushes the ghost downward via `clear: right`.

**Ghost** — same dimensions as the real image, `visibility: hidden`. This is what actually causes text to wrap. Its position is controlled entirely by the spacer's height.

**Real image** — `position: absolute` in the scroll viewport, outside `#scroll-content`. It never moves.

## Keeping Ghost and Image Aligned During Scroll

As the user scrolls, `#scroll-content` is translated upward by `currentScrollY`. The ghost (inside the content) would drift up with it — moving away from the pinned image. To compensate, the spacer's height is increased by the same amount:

```
spacerEl.style.height = TEXT_WRAP_TOP + currentScrollY
```

The ghost's layout position in the content = `TEXT_WRAP_TOP + currentScrollY`.
The ghost's visual position = layout position − currentScrollY = `TEXT_WRAP_TOP`.
The image's visual position = `IMAGE_TOP` (fixed).

`IMAGE_TOP` is set slightly higher than `TEXT_WRAP_TOP` to create breathing room between the last full-width line and the top edge of the image.

## Avoiding Jitter at the Scroll Boundary

`maxScroll` is calculated once on mount and again on resize — never inside the scroll handlers. Recalculating it on every scroll event creates a feedback loop: changing the spacer height triggers a layout reflow, changing `scrollHeight`, changing `maxScroll`, causing a one-frame bounce at the end of the scroll range.

## The Fade Hint

A `mask-image` CSS gradient on the scroll viewport fades the bottom ~48px to transparent, signalling to the user that content is scrollable.

## Options (passed to `pinnedFloatScroll`)

| Option | Value in use | Meaning |
|---|---|---|
| `pinnedWidth` | `var(--cta-image-width)` | Width of the pinned element and its ghost float |
| `pinnedAspectRatio` | `471/831` | Aspect ratio used to size the ghost float |
| `gapAdjust` | `0` (default) | Adds to the 12 px default gap on **both** top and bottom edges; negative values tighten spacing |
| `textWrapTop` | `72` (default) | Distance in px before text starts wrapping; `imageTop` is derived as `textWrapTop + (5 + gapAdjust)` |

## Gap Geometry

The library hard-codes a 12 px base gap and applies it symmetrically:

```
totalGap = 5 + gapAdjust

imageTop            = textWrapTop + totalGap
ghost border top    = textWrapTop                 (no marginTop — see below)
ghost marginBottom  = 2 × totalGap               (internal: 1× offsets ghost/image,
                                                   1× creates the visible bottom gap)
```

This means `gapAdjust: 5` gives 10 px of breathing room on both edges with no further tuning.
