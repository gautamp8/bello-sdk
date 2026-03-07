=== Bello Widget ===
Contributors: bello
Tags: voice, chat, widget, ai
Requires at least: 6.0
Tested up to: 6.9.1
Requires PHP: 7.4
Stable tag: 0.4.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed the Bello voice widget on your WordPress site with a block, shortcode, or global settings.

== Description ==

Bello Widget uses the same frontend runtime as the Bello npm package and CDN embed.

Features:

* Current Bello credentials: Project ID + Widget API Key
* Admin settings for theme, position, accent color, and widget copy
* Gutenberg block + shortcode support: `[bello_widget]`
* Optional global loading
* Local bundled SDK asset, with filter hooks for custom hosting

== Installation ==

1. Upload the plugin zip or install it from WordPress.org once published.
2. Activate the plugin.
3. Go to Settings -> Bello Widget.
4. Add your Project ID and Widget API Key.
5. Add the Bello Widget block or the `[bello_widget]` shortcode.

== Frequently Asked Questions ==

= How do I show the widget on every page? =

Enable Load globally in Settings -> Bello Widget.

= Can I override settings per page? =

Yes. The block inspector and shortcode both support project, placement, theme, accent color, copy, and agent/voice overrides.

= Can I host the SDK yourself? =

Yes. Use the `bello_widget_script_url` filter. The older `bello_widget_cdn_url` filter is still supported for backward compatibility.

== Changelog ==

= 0.4.0 =
* Rebuilt the plugin around the current Bello SDK contract.
* Added Widget API Key support and current UI/runtime overrides.
* Switched default loading to a local bundled SDK asset.
* Added repo-local wp-env workflow for local testing.

== Upgrade Notice ==

= 0.4.0 =
This release replaces the old orb-style/glass-theme settings with the current Bello SDK options.
