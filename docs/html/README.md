# Bello SDK for HTML, CSS, and JavaScript

Use the Bello SDK on any site with a single script tag and optional JavaScript and CSS customization.

## HTML quickstart

Place the script before the closing `</body>` tag:

```html
<script
  src="https://unpkg.com/@heybello/bello-sdk@latest/dist/bello-embed.iife.js"
  defer
  data-project-id="YOUR_PROJECT_ID"
  data-api-base-url="https://your-api.example.com"
  data-position="bottom-right"
  data-theme="dark"
  data-orb-style="galaxy"
  data-agent-enabled="true"
  data-voice-enabled="true"
></script>
```

Data attributes you can use in HTML:

| Attribute | Required | Values | Notes |
| --- | --- | --- | --- |
| `data-project-id` | Yes | Project UUID | Required to load the widget |
| `data-api-base-url` | No | URL | Your Bello API base URL |
| `data-position` | No | `bottom-right`, `bottom-left`, `top-right`, `top-left` | Widget position |
| `data-theme` | No | `dark`, `light`, `glass` | UI theme |
| `data-orb-style` | No | See orb styles below | Orb animation style |
| `data-agent-enabled` | No | `true`, `false` | Disables LiveKit connect when `false` |
| `data-voice-enabled` | No | `true`, `false` | Disables voice playback when `false` |

Available orb styles: `galaxy`, `ocean-depths`, `caribbean`, `cherry-blossom`, `emerald`, `multi-color`, `golden-glow`, `volcanic`.

If you need `widgetTitle`, `widgetButtonTitle`, or `themeVars`, initialize in JavaScript instead of using only HTML.

## JavaScript API

Queue commands before or after the SDK loads:

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
      orbStyle: 'galaxy',
      widgetTitle: 'Need support?',
      widgetButtonTitle: 'Chat with AI'
    }
  ]);

  // Programmatic controls
  window.Bello.push(['open']);
  // window.Bello.push(['update', { theme: 'light' }]);
  // window.Bello.push(['close']);
</script>
```

JavaScript options reference:

| Option | Type | Notes |
| --- | --- | --- |
| `projectId` | `string` | Required |
| `apiBaseUrl` | `string` | Optional API base URL |
| `position` | `string` | `bottom-right`, `bottom-left`, `top-right`, `top-left` |
| `theme` | `string` | `dark`, `light`, `glass` |
| `orbStyle` | `string` | One of the orb styles listed above |
| `widgetTitle` | `string` | Launcher title text |
| `widgetButtonTitle` | `string` | Launcher button text |
| `agentEnabled` | `boolean` | Default `true` |
| `voiceEnabled` | `boolean` | Default `true` |
| `themeVars` | `Record<string, string>` | CSS custom properties map |

## CSS customization

You can theme the widget using CSS custom properties on `#bello-widget-root`.

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

Available CSS variables:

| Variable | Purpose |
| --- | --- |
| `--bello-bg` | Base background color |
| `--bello-fg` | Primary text color |
| `--bello-surface` | Card surface color |
| `--bello-border` | Border color |
| `--bello-cta-bg` | Primary button background |
| `--bello-cta-fg` | Primary button text |
| `--bello-subtle` | Subtle text color |
| `--bello-danger` | Destructive button background |
| `--bello-shadow` | Container shadow |
| `--bello-radius` | Container border radius |
| `--bello-radius-pill` | Pill button radius |
| `--bello-gap` | Spacing unit |
| `--bello-pop-offset` | Popover offset |
| `--bello-width` | Widget width |
| `--bello-height` | Widget height |
| `--bello-fab-size-width` | Launcher width |
| `--bello-fab-size-height` | Launcher height |
| `--bello-fab-gap` | Launcher offset gap |

You can also pass `themeVars` in JavaScript to set these values programmatically.
