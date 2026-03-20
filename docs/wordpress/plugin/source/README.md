# Included SDK Source

This plugin ships with a generated frontend runtime at `assets/sdk/bello-embed.iife.js`.

The human-readable source used to build that file is included in `source/sdk/` inside this plugin package.

The same source is also maintained in the public repository:

- `https://github.com/gautamp8/bello-sdk`
- `https://github.com/gautamp8/bello-sdk/tree/main/src`
- `https://github.com/gautamp8/bello-sdk/tree/main/docs/wordpress/plugin`

## Main files

- `source/sdk/src/` contains the TypeScript and React source for the widget runtime.
- `source/sdk/scripts/build-widget-css.mjs` rebuilds the generated widget CSS file used by the runtime.
- `source/sdk/scripts/widget-tailwind-input.css` is the CSS build input.
- `source/sdk/vite.config.ts` is the JavaScript bundle build configuration.
- `source/sdk/package.json` lists the build dependencies.

## Rebuild the bundled runtime

Node.js and `pnpm` are required.

1. Change into `source/sdk`
2. Run `pnpm install`
3. Run `pnpm exec node ./scripts/build-widget-css.mjs`
4. Run `BELLO_EMBED_OUT_DIR=../../assets/sdk BELLO_EMBED_FORMATS=iife BELLO_EMBED_EMPTY_OUT_DIR=true BELLO_DISABLE_PUBLIC_DIR=true BELLO_EMBED_SOURCEMAP=false pnpm exec vite build --mode embed`

That rebuilds `assets/sdk/bello-embed.iife.js` from the included source snapshot.
