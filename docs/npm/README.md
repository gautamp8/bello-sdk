# Bello SDK NPM Guide

This guide covers installing and using the Bello SDK via npm for React and JavaScript bundlers.

## Install

```bash
npm install @heybello/bello-sdk
# or
pnpm add @heybello/bello-sdk
# or
yarn add @heybello/bello-sdk
```

## React usage

```tsx
import { BelloWidget } from '@heybello/bello-sdk/react';

export default function Page() {
  return (
    <BelloWidget
      projectId="YOUR_PROJECT_ID"
      apiBaseUrl="https://your-api.example.com"
      position="bottom-right"
      theme="dark"
      orbStyle="galaxy"
    />
  );
}
```

Notes:
- The React export bundles the widget directly and does not require a `<script>` tag.
- `projectId` is required. Everything else is optional.

## JavaScript bundler usage

If you want full control via JavaScript (non-React), load the IIFE file from npm in your build:

```html
<script type="module">
  import '@heybello/bello-sdk/dist/bello-embed.iife.js';

  window.Bello = window.Bello || [];
  window.Bello.push([
    'init',
    {
      projectId: 'YOUR_PROJECT_ID',
      apiBaseUrl: 'https://your-api.example.com',
      position: 'bottom-right',
      theme: 'dark',
      orbStyle: 'galaxy',
      widgetTitle: 'Need support?',
      widgetButtonTitle: 'Chat with AI'
    }
  ]);
</script>
```

If your bundler doesn’t support bare specifiers in the browser, use CDN in `docs/html/README.md` instead.

## Programmatic controls

```js
window.Bello.push(['open']);
window.Bello.push(['close']);
window.Bello.push(['update', { theme: 'light' }]);
```

## Options reference

| Option | Type | Notes |
| --- | --- | --- |
| `projectId` | `string` | Required |
| `apiBaseUrl` | `string` | Optional API base URL |
| `position` | `string` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `theme` | `string` | `dark`, `light`, `glass` |
| `orbStyle` | `string` | `galaxy`, `ocean-depths`, `caribbean`, `cherry-blossom`, `emerald`, `multi-color`, `golden-glow`, `volcanic` |
| `widgetTitle` | `string` | Launcher title text |
| `widgetButtonTitle` | `string` | Launcher button text |
| `agentEnabled` | `boolean` | Default `true` |
| `voiceEnabled` | `boolean` | Default `true` |
| `themeVars` | `Record<string, string>` | CSS custom properties map |

## Styling with CSS variables

Define theme variables on `#bello-widget-root`:

```css
#bello-widget-root {
  --bello-bg: #0b0f1a;
  --bello-fg: #f8fafc;
  --bello-surface: #0f172a;
  --bello-border: rgba(148, 163, 184, 0.3);
  --bello-cta-bg: #14b8a6;
  --bello-cta-fg: #0f172a;
  --bello-radius: 16px;
  --bello-width: 420px;
  --bello-height: 520px;
}
```

For the full list of CSS variables, see `docs/html/README.md`.

## Types

TypeScript types are shipped with the package. You can import them from `@heybello/bello-sdk`:

```ts
import type { InitOptions, Theme, OrbStyle } from '@heybello/bello-sdk';
```

## Troubleshooting

- If the widget doesn't appear, confirm the `projectId` and `apiBaseUrl` are correct.
- If you want to disable live voice connection, set `agentEnabled: false`.
- If you only want UI preview, set both `agentEnabled: false` and `voiceEnabled: false`.
