# Bello SDK

Embed AI voice agents into any website in minutes.

## Install

```bash
npm install @heybello/bello-sdk
```

## HTML / Script Tag

Add this before the closing `</body>` tag:

```html
<script
  src="https://unpkg.com/@heybello/bello-sdk@latest/dist/bello-embed.iife.js"
  defer
  data-project-id="YOUR_PROJECT_ID"
  data-widget-api-key="YOUR_WIDGET_API_KEY"
></script>
```

The widget automatically loads your project's configuration (theme, colors, titles, voice) from the Bello dashboard.

### Optional overrides

Override dashboard settings with data attributes:

```html
<script
  src="https://unpkg.com/@heybello/bello-sdk@latest/dist/bello-embed.iife.js"
  defer
  data-project-id="YOUR_PROJECT_ID"
  data-widget-api-key="YOUR_WIDGET_API_KEY"
  data-theme="light"
  data-accent-color="#FF6B2C"
  data-position="bottom-left"
></script>
```

### Programmatic control

```js
window.Bello.push(['open']);   // Open the widget
window.Bello.push(['close']);  // Close the widget
window.Bello.push(['update', { theme: 'light' }]);
```

## React / Next.js

```tsx
import { BelloWidget } from '@heybello/bello-sdk/react';

export default function Page() {
  return (
    <BelloWidget
      projectId="YOUR_PROJECT_ID"
      widgetApiKey="YOUR_WIDGET_API_KEY"
    />
  );
}
```

## WordPress

The repo also includes a WordPress plugin wrapper that uses the same frontend runtime as the npm package and CDN embed.

### What is included

- Plugin source: `docs/wordpress/plugin`
- Local bundled SDK asset: `docs/wordpress/plugin/assets/sdk/bello-embed.iife.js`
- Installable zip output: `docs/wordpress/dist/bello-widget.zip`

### Local WordPress test

Docker is required because the local site runs through `wp-env`.

1. Install dependencies:

```bash
pnpm install
```

2. If your Bello API is running locally, export the values you want the seed script to save into WordPress:

```bash
export BELLO_WORDPRESS_PROJECT_ID="YOUR_PROJECT_ID"
export BELLO_WORDPRESS_WIDGET_API_KEY="YOUR_WIDGET_API_KEY"
export BELLO_WORDPRESS_API_BASE_URL="http://localhost:3001"
```

3. Start the full WordPress loop:

```bash
pnpm wordpress:dev
```

That command will:

- build the current SDK bundle into the plugin folder
- start the local WordPress site
- activate the `bello-widget` plugin
- create or update a `Bello Widget Demo` page with `[bello_widget]`
- keep rebuilding the plugin bundle when SDK code changes

4. Open the demo page:

```text
http://127.0.0.1:8888/bello-widget-demo/
```

Use `127.0.0.1` instead of `localhost` if your browser has stale `localhost` cookies or headers.

### One-shot terminal env example

If you do not want to export env vars into your shell session, run the seed step inline:

```bash
BELLO_WORDPRESS_PROJECT_ID="YOUR_PROJECT_ID" \
BELLO_WORDPRESS_WIDGET_API_KEY="YOUR_WIDGET_API_KEY" \
BELLO_WORDPRESS_API_BASE_URL="http://localhost:3001" \
pnpm wordpress:env:seed
```

Use this after `pnpm wordpress:env:start` if the WordPress site is already running and you only want to update saved plugin settings.

### Useful commands

```bash
pnpm wordpress:build      # build the SDK bundle into the plugin folder
pnpm wordpress:watch      # rebuild the plugin bundle when SDK files change
pnpm wordpress:env:start  # start the local WordPress site
pnpm wordpress:env:seed   # activate plugin + seed/update the demo page
pnpm wordpress:env:stop   # stop the local WordPress containers
pnpm wordpress:env:clean  # destroy the local WordPress environment
pnpm wordpress:zip        # create docs/wordpress/dist/bello-widget.zip
```

### Install the zip on a real WordPress site

1. Run:

```bash
pnpm wordpress:zip
```

2. Upload [bello-widget.zip](/Users/zaidjamal/zaid/bello/bello-sdk/docs/wordpress/dist/bello-widget.zip) in `Plugins -> Add New -> Upload Plugin`.
3. Activate the plugin.
4. Go to `Settings -> Bello Widget`.
5. Fill in `Project ID` and `Widget API Key`.
6. Either:
   - add `[bello_widget]` to a page, or
   - enable `Load globally`.

### Troubleshooting WordPress local testing

- `zsh: command not found: wp-env`: use `pnpm wordpress:env:start` or `pnpm exec wp-env ...`. `wp-env` is a local dev dependency, not a global binary.
- `Bad Request` at `http://localhost:8888`: try `http://127.0.0.1:8888` or clear site data for `localhost:8888` in your browser.
- Page loads but no widget appears: the plugin skips rendering until `Project ID` and `Widget API Key` are set.
- Widget shell appears but voice/chat fails: your `apiBaseUrl` or Bello backend is not reachable from the WordPress site.

See `docs/wordpress/README.md` for the dedicated WordPress notes.

## Props / Attributes

| Prop | Data Attribute | Type | Required | Description |
|------|---------------|------|----------|-------------|
| `projectId` | `data-project-id` | `string` | Yes | Your Bello project ID |
| `widgetApiKey` | `data-widget-api-key` | `string` | Yes | Widget API key from the Deploy step |
| `theme` | `data-theme` | `'light' \| 'dark'` | No | Override theme |
| `accentColor` | `data-accent-color` | `string` | No | Override accent color (hex) |
| `position` | `data-position` | `'bottom-right' \| 'bottom-left' \| 'top-right' \| 'top-left'` | No | Override widget position |
| `widgetTitle` | — | `string` | No | Override widget title |
| `widgetSubtitle` | — | `string` | No | Override subtitle |
| `widgetButtonTitle` | — | `string` | No | Override CTA button text |
| `agentEnabled` | `data-agent-enabled` | `boolean` | No | Set `false` for UI-only preview |

All optional props override your dashboard configuration. If omitted, dashboard settings are used.

## Getting your credentials

1. Create a project at [bello.ai](https://bello.ai)
2. Configure your agent's voice, personality, and knowledge base
3. Go to **Deploy** to get your `projectId` and `widgetApiKey`
4. Paste the embed code into your site
