=== Bello Widget ===
Contributors: zaidop
Tags: voice, chat, widget, ai
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.4.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed the Bello voice widget on your WordPress site with a block, shortcode, or global settings.

== Description ==

Bello Widget connects your WordPress site to the Bello service. A Bello account plus a valid Project ID and Widget API Key are required. The plugin loads a bundled local copy of the Bello frontend runtime, then makes API requests to the Bello service endpoint you configure in order to fetch widget settings, create live session tokens, and close sessions cleanly.

Features:

* Current Bello credentials: Project ID + Widget API Key
* Admin settings for theme, position, accent color, and widget copy
* Gutenberg block + shortcode support: `[zaidop_bello_widget]`
* Optional global loading
* Local bundled SDK asset included in the plugin package

== Source Code ==

This plugin ships with a generated frontend bundle at `assets/sdk/bello-embed.iife.js`.

Human-readable source code for that generated bundle is included directly in this plugin package:

* Source overview and rebuild notes: `source/README.md`
* SDK source snapshot: `source/sdk/src/`
* SDK build dependencies: `source/sdk/package.json`
* SDK bundle config: `source/sdk/vite.config.ts`
* SDK CSS build files: `source/sdk/scripts/build-widget-css.mjs` and `source/sdk/scripts/widget-tailwind-input.css`

The same source is also maintained in the public repository:

* Repository: https://github.com/gautamp8/bello-sdk
* WordPress plugin source: https://github.com/gautamp8/bello-sdk/tree/main/docs/wordpress/plugin
* SDK source used to build `assets/sdk/bello-embed.iife.js`: https://github.com/gautamp8/bello-sdk/tree/main/src
* WordPress build documentation: https://github.com/gautamp8/bello-sdk/tree/main/docs/wordpress

To rebuild `assets/sdk/bello-embed.iife.js` from the included source snapshot:

1. Change into `source/sdk`
2. Run `pnpm install`
3. Run `pnpm exec node ./scripts/build-widget-css.mjs`
4. Run `BELLO_EMBED_OUT_DIR=../../assets/sdk BELLO_EMBED_FORMATS=iife BELLO_EMBED_EMPTY_OUT_DIR=true BELLO_DISABLE_PUBLIC_DIR=true BELLO_EMBED_SOURCEMAP=false pnpm exec vite build --mode embed`

That rebuilds the bundled SDK asset directly inside the plugin package.

== Installation ==

1. Upload the plugin zip or install it from WordPress.org once published.
2. Activate the plugin.
3. Go to Settings -> Bello Widget.
4. Add your Project ID and Widget API Key.
5. Add the Bello Widget block or the `[zaidop_bello_widget]` shortcode.

== Frequently Asked Questions ==

= How do I show the widget on every page? =

Enable Load globally in Settings -> Bello Widget.

= Can I override settings per page? =

Yes. The block inspector and shortcode both support project, placement, theme, accent color, copy, and agent/voice overrides.

= Does this plugin call the Bello service? =

Yes. It calls the Bello service endpoint to fetch widget configuration and create live session tokens. You can use the default Bello API or a custom API Base URL that you control.

== External services ==

This plugin connects to the Bello service so it can load the widget configuration and start realtime widget sessions for site visitors.

By default, the plugin sends requests to `https://www.heybello.dev/api`. If the site owner sets a custom `API Base URL` in the plugin settings, the same requests are sent to that custom endpoint instead.

When the widget is initialized, the plugin sends the configured `Project ID` and `Widget API Key` to the Bello API to fetch the public widget configuration used to render the widget.

When a visitor starts a live session, the plugin sends the `Project ID` and `Widget API Key` to the Bello API again so the service can create a live session token and return connection details for the realtime session.

When a live session ends, the plugin sends the generated session ID back to the Bello API so the session can be marked as ended. If live agent mode is enabled, the visitor's browser also connects directly to the realtime media server URL returned by Bello for that session.

Service provider: Bello
Terms of service: https://www.heybello.dev/terms
Privacy policy: https://www.heybello.dev/privacy

== Changelog ==

= 0.4.4 =
* Added suggested privacy-policy text in WordPress admin via `wp_add_privacy_policy_content()`.
* Bundled the human-readable SDK source snapshot and local rebuild instructions inside the plugin package.

= 0.4.3 =
* Updated the default Bello API base URL to `https://www.heybello.dev/api` across the bundled SDK and WordPress package.

= 0.4.2 =
* Validated accent colors as CSS hex values and allowed empty values.
* Locked the frontend runtime to the bundled local SDK asset.
* Added public source-code and build documentation for the generated bundle.
* Added a dedicated external-services section with data-flow details.

= 0.4.1 =
* Replaced generic WordPress identifiers with a unique plugin prefix.
* Clarified the service usage and account requirement in the plugin readme.

= 0.4.0 =
* Rebuilt the plugin around the current Bello SDK contract.
* Added Widget API Key support and current UI/runtime overrides.
* Switched default loading to a local bundled SDK asset.
* Added repo-local wp-env workflow for local testing.

== Upgrade Notice ==

= 0.4.4 =
This release adds suggested Bello service disclosure text to the WordPress privacy-policy guide.

= 0.4.3 =
This release updates the default Bello API base URL used by the bundled widget runtime.
