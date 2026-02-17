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
