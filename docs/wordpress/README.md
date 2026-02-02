# Bello WordPress Integration

This guide provides a WordPress plugin that can be published to WordPress.org so users can install it directly from **Plugins → Add New** with no manual file edits.

## Recommended setup (publish a plugin)

Why this is best for broad adoption:
- one-click install from the WordPress admin
- admin settings for Project ID and API Base URL
- works with any theme
- easy updates via CDN

## Plugin package (WordPress.org-ready)

Plugin files are included at:

```
docs/wordpress/plugin/
  bello-widget.php
  readme.txt
  uninstall.php
```

## How users install (after you publish)

1) WordPress admin → Plugins → Add New.
2) Search “Bello Widget”.
3) Click Install, then Activate.
4) Go to **Settings → Bello Widget** and fill in Project ID + API Base URL.
5) (Optional) Enable **Load globally** to initialize on every page.
6) Add the **Bello Widget** block or the shortcode `[bello_widget]` to any page or post.

## Gutenberg block

Add the **Bello Widget** block from the block inserter. The inspector lets you override Project ID, API Base URL, position, theme, orb style, and voice toggles.

## Shortcode

Basic usage:

```
[bello_widget]
```

Override settings per page:

```
[bello_widget project_id="YOUR_PROJECT_ID" api_base_url="https://your-api.example.com" position="bottom-right" theme="dark" orb_style="galaxy" agent_enabled="true" voice_enabled="true"]
```

Note: The widget is global per page. If multiple shortcodes are used with different options, the last one on the page wins.

## Advanced filters (developer)

Use filters to customize behavior without editing the plugin:

```php
add_filter('bello_widget_cdn_url', function ($url) {
    return 'https://cdn.yourdomain.com/bello-embed.iife.js';
});

add_filter('bello_widget_init_options', function ($opts, $args) {
    $opts['widgetTitle'] = 'Need help?';
    return $opts;
}, 10, 2);
```

## Manual embed (fast test only)

Use a Custom HTML block or header/footer injection:

```html
<script
  src="https://unpkg.com/@heybello/bello-sdk@latest/dist/bello-embed.iife.js"
  defer
  data-project-id="YOUR_PROJECT_ID"
  data-api-base-url="https://your-api.example.com"
  data-position="bottom-right"
  data-theme="dark"
  data-orb-style="galaxy"
></script>
```

## How to test the plugin

1) Install and activate the plugin.
2) Set Project ID and API Base URL under **Settings → Bello Widget**.
3) Add `[bello_widget]` to a page and publish.
4) Open the page and verify the widget loads.
5) Check the browser console and network tab for errors.

## Publishing checklist (WordPress.org)

1) Zip the plugin folder (the folder should be named `bello-widget`).
2) Ensure `readme.txt` metadata is accurate.
3) Add your WordPress.org assets (icons, banners, screenshots) in `docs/wordpress/plugin/assets`.
4) Submit the plugin to WordPress.org.
5) After approval, users can install it directly from the admin.

## Troubleshooting

- Widget not loading:
  - Confirm the script URL is reachable.
  - Check for JS errors in the console.
- API calls failing:
  - Ensure your API allows requests from your WordPress domain.
