# Publishing pinned-float-scroll as an npm Package

The core library lives at `src/lib/pinned-float-scroll.ts`. It has zero runtime
dependencies and no framework knowledge — extracting it is mostly scaffolding.

---

## 1. Create the repo

```bash
mkdir pinned-float-scroll
cd pinned-float-scroll
git init
npm init -y
```

## 2. Copy the source

```bash
cp <jays_website>/src/lib/pinned-float-scroll.ts src/index.ts
```

The file is the entire library. No other source files are needed for the core.

## 3. package.json

```json
{
  "name": "pinned-float-scroll",
  "version": "0.1.0",
  "description": "Pin an element top-right while text scrolls around it using a two-float ghost system.",
  "keywords": ["scroll", "float", "text-wrap", "pinned", "layout"],
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

`tsup` handles ESM + CJS dual output and `.d.ts` generation in one command with
no config file. Install it: `npm i -D tsup typescript`.

## 4. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "dist",
    "lib": ["ES2019", "DOM"]
  },
  "include": ["src"]
}
```

## 5. Build and verify

```bash
npm run build
# dist/
#   index.js      (ESM)
#   index.cjs     (CommonJS)
#   index.d.ts    (types)
```

Check the output looks right before publishing.

## 6. Publish

```bash
npm login
npm publish --access public
```

---

## Framework wrapper packages

Each wrapper is a separate package that lists `pinned-float-scroll` as a peer
dependency. They are thin — typically one file.

### Svelte (`pinned-float-scroll-svelte`)

```ts
// src/index.ts
import { pinnedFloatScroll, type PinnedFloatScrollOptions } from 'pinned-float-scroll';

export function pfs(viewport: HTMLElement, options: PinnedFloatScrollOptions) {
    const pinned = viewport.querySelector('[data-pfs-pinned]') as HTMLElement;
    const content = viewport.querySelector('[data-pfs-content]') as HTMLElement;
    return pinnedFloatScroll(viewport, pinned, content, options);
    // Svelte calls the returned destroy() automatically
}
```

Usage in a Svelte component:
```svelte
<script>
  import { pfs } from 'pinned-float-scroll-svelte';
</script>

<div use:pfs={{ pinnedWidth: '140px', pinnedAspectRatio: '471/831' }}>
  <img data-pfs-pinned src="..." />
  <div data-pfs-content><p>text...</p></div>
</div>
```

### React (`pinned-float-scroll-react`)

```ts
// src/index.ts
import { useEffect, useRef } from 'react';
import { pinnedFloatScroll, type PinnedFloatScrollOptions } from 'pinned-float-scroll';

export function usePinnedFloatScroll(options: PinnedFloatScrollOptions) {
    const viewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const viewport = viewportRef.current!;
        const pinned = viewport.querySelector('[data-pfs-pinned]') as HTMLElement;
        const content = viewport.querySelector('[data-pfs-content]') as HTMLElement;
        const { destroy } = pinnedFloatScroll(viewport, pinned, content, options);
        return destroy;
    }, []); // options intentionally omitted — reinitialise manually if needed

    return viewportRef;
}
```

Usage:
```tsx
import { usePinnedFloatScroll } from 'pinned-float-scroll-react';

export function MyComponent() {
    const viewportRef = usePinnedFloatScroll({
        pinnedWidth: '140px',
        pinnedAspectRatio: '471/831',
    });

    return (
        <div ref={viewportRef} style={{ flex: '1 1 0', minHeight: 0 }}>
            <img data-pfs-pinned src="..." alt="..." />
            <div data-pfs-content><p>text...</p></div>
        </div>
    );
}
```

### Vue (`pinned-float-scroll-vue`)

```ts
// src/index.ts
import { onMounted, onUnmounted, ref } from 'vue';
import { pinnedFloatScroll, type PinnedFloatScrollOptions } from 'pinned-float-scroll';

export function usePinnedFloatScroll(options: PinnedFloatScrollOptions) {
    const viewportRef = ref<HTMLElement | null>(null);
    let destroy: (() => void) | null = null;

    onMounted(() => {
        const viewport = viewportRef.value!;
        const pinned = viewport.querySelector('[data-pfs-pinned]') as HTMLElement;
        const content = viewport.querySelector('[data-pfs-content]') as HTMLElement;
        ({ destroy } = pinnedFloatScroll(viewport, pinned, content, options));
    });

    onUnmounted(() => destroy?.());

    return viewportRef;
}
```

---

## Notes

- The `data-pfs-pinned` / `data-pfs-content` convention is just for the wrapper
  packages. The core `pinnedFloatScroll` function takes explicit element
  references and has no opinions about how you select them.
- The core has no browser polyfills. `aspect-ratio` requires Chrome 88+,
  Safari 15+, Firefox 89+. `mask-image` requires the `-webkit-` prefix on
  Safari, which the library applies automatically.
- See `docs/home-scroll-effect.md` for a full explanation of the ghost float
  technique and why `margin-top` on a float cannot be used for this purpose.
