# Bello SDK

Embed voice agents into any website in minutes.

## Overview

Bello SDK is a lightweight JavaScript library that enables you to integrate conversational voice agents into your web applications quickly and easily. Transform your website's user experience with natural voice interactions.

**Supports multiple platforms:** HTML/JS, React, WordPress, and Shopify.

## Features

- **Multi-Platform Support** - Works with vanilla JS, React, WordPress, and Shopify
- **Quick Integration** - Get started in minutes with minimal setup
- **Voice-First Experience** - Natural conversation with your users
- **Cross-Browser Support** - Works across all modern browsers
- **Customizable UI** - Adapt the interface to match your brand
- **Real-time Voice Processing** - Low-latency voice recognition and synthesis
- **Event-Driven Architecture** - React to conversation events in your application

## Install

```bash
pnpm add @bello/bello-sdk
# or
npm install @bello/bello-sdk
```

## CDN / HTML usage

```html
<script
  src="https://unpkg.com/@bello/bello-sdk@latest/dist/bello-embed.iife.js"
  defer
  data-project-id="YOUR_PROJECT_ID"
  data-api-base-url="https://your-api.example.com"
  data-position="bottom-right"
  data-theme="dark"
  data-orb-style="galaxy"
></script>
```

You can also initialize manually:

```html
<script>
  window.Bello = window.Bello || [];
  window.Bello.push([
    'init',
    {
      projectId: 'YOUR_PROJECT_ID',
      apiBaseUrl: 'https://your-api.example.com',
      position: 'bottom-right',
      theme: 'dark',
      orbStyle: 'galaxy'
    }
  ]);
</script>
```

## React / Next.js usage

```tsx
import { BelloWidget } from '@bello/bello-sdk/react';

export default function Page() {
  return (
    <BelloWidget
      projectId="YOUR_PROJECT_ID"
      apiBaseUrl="https://your-api.example.com"
    />
  );
}
```

The React package bundles the widget directly and does not require a
separate script tag.

## Local development and testing

```bash
pnpm install
pnpm dev:iife
```

Open `http://localhost:5174/src/playground-embed.html` to test the CDN
flow locally.

### Build the npm package

```bash
pnpm build
```

Outputs:

- `dist/bello-embed.iife.js` (CDN / IIFE)
- `dist/react.es.js` and `dist/react.cjs` (frameworks)
- `dist/*.d.ts` (types)

### Test the package locally in another app

```bash
# from your consuming app
pnpm add ../bello-sdk
# or
npm install ../bello-sdk
```
