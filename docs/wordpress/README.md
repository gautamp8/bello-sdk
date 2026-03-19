# Bello WordPress Plugin

The plugin in `docs/wordpress/plugin` is a thin wrapper over the current Bello embed runtime. It uses the same frontend widget as the npm package and script-tag embed, then exposes WordPress-native placement and settings.

## What it supports

- Settings page for `projectId`, `widgetApiKey`, optional `apiBaseUrl`, theme, position, accent color, widget copy, and agent/voice toggles
- Gutenberg block
- Shortcode: `[zaidop_bello_widget]`
- Optional global loading on every frontend page
- Local bundled SDK asset by default

## Local testing

Docker is required because the local workflow uses `wp-env`.

1. Install dependencies:

```bash
pnpm install
```

2. Pass the values you want the seed script to store in WordPress:

```bash
export BELLO_WORDPRESS_PROJECT_ID="YOUR_PROJECT_ID"
export BELLO_WORDPRESS_WIDGET_API_KEY="YOUR_WIDGET_API_KEY"
export BELLO_WORDPRESS_API_BASE_URL="http://localhost:3001"
```

3. Start the full loop:

```bash
pnpm wordpress:dev
```

That will:

- build the current SDK into the plugin asset folder
- start the local WordPress environment
- activate the plugin
- seed a `Bello Widget Demo` page containing `[zaidop_bello_widget]`
- keep rebuilding the plugin bundle when the SDK changes

Default local URLs:

- WordPress site: `http://127.0.0.1:8888`
- Demo page slug: `http://127.0.0.1:8888/bello-widget-demo/`

If `localhost` gives you a `400 Bad Request` page in the browser, use `127.0.0.1` instead or clear browser site data for `localhost:8888`.

## Pass env values inline

If WordPress is already running and you only want to update the saved plugin settings and the demo page, use one inline command:

```bash
BELLO_WORDPRESS_PROJECT_ID="YOUR_PROJECT_ID" \
BELLO_WORDPRESS_WIDGET_API_KEY="YOUR_WIDGET_API_KEY" \
BELLO_WORDPRESS_API_BASE_URL="http://localhost:3001" \
pnpm wordpress:env:seed
```

This is useful after changing credentials or switching between Bello environments.

## Useful commands

- `pnpm wordpress:build` builds the local plugin SDK asset
- `pnpm wordpress:zip` creates `docs/wordpress/dist/bello-widget.zip`
- `pnpm wordpress:env:start` starts WordPress
- `pnpm wordpress:env:seed` activates the plugin and seeds the demo page
- `pnpm wordpress:env:stop` stops the containers
- `pnpm wordpress:env:clean` destroys the local environment

If you need the raw `wp-env` CLI, use `pnpm exec wp-env ...`. Do not expect `wp-env` to exist as a global shell command.

## Real WordPress install

1. Build the zip:

```bash
pnpm wordpress:zip
```

2. Upload `docs/wordpress/dist/bello-widget.zip` through `Plugins -> Add New -> Upload Plugin`.
3. Activate `Bello Widget`.
4. Go to `Settings -> Bello Widget`.
5. Add your `Project ID` and `Widget API Key`.
6. Add `[zaidop_bello_widget]` to a page or enable `Load globally`.

## Shortcode overrides

```text
[zaidop_bello_widget project_id="YOUR_PROJECT_ID" widget_api_key="YOUR_WIDGET_API_KEY" theme="light" position="bottom-left" accent_color="#FF6B2C"]
```

Page-level block and shortcode overrides take precedence over saved settings. If multiple widget declarations are rendered on the same page, the last one wins because the runtime is singleton per page.

## Troubleshooting

- `wp-env start` fails in the shell: run `pnpm wordpress:env:start` instead.
- The WordPress page loads but the widget is missing: check `Settings -> Bello Widget` or rerun `pnpm wordpress:env:seed` with the required env vars.
- The widget opens but cannot connect: verify `BELLO_WORDPRESS_API_BASE_URL` points at a reachable API and that your backend allows requests from the WordPress origin.
