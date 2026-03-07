=== Bello Widget ===
Contributors: zaidop
Tags: voice, chat, widget, ai
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.4.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed the Bello voice widget on your WordPress site with a block, shortcode, or global settings.

== Description ==

Bello Widget connects your WordPress site to the Bello service. A Bello account plus a valid Project ID and Widget API Key are required. The plugin loads a bundled local copy of the Bello frontend runtime, then makes API requests to the Bello service endpoint you configure in order to fetch widget settings and create live session tokens.

Features:

* Current Bello credentials: Project ID + Widget API Key
* Admin settings for theme, position, accent color, and widget copy
* Gutenberg block + shortcode support: `[zaidop_bello_widget]`
* Optional global loading
* Local bundled SDK asset included in the plugin package

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

== Changelog ==

= 0.4.1 =
* Replaced generic WordPress identifiers with a unique plugin prefix.
* Clarified the service usage and account requirement in the plugin readme.

= 0.4.0 =
* Rebuilt the plugin around the current Bello SDK contract.
* Added Widget API Key support and current UI/runtime overrides.
* Switched default loading to a local bundled SDK asset.
* Added repo-local wp-env workflow for local testing.

== Upgrade Notice ==

= 0.4.1 =
This release updates the plugin's internal WordPress identifiers and readme metadata for WordPress.org review compliance.
