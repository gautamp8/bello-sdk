=== Bello Widget ===
Contributors: bello
Tags: voice, chat, widget, ai
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 0.3.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Embed the Bello voice widget on your WordPress site with a block, shortcode, or global settings.

== Description ==

Bello Widget lets you add a voice-first support experience to any WordPress site. Configure it once in Settings and place it anywhere using a shortcode, or enable global loading to show it on all pages.

Features:

* Admin settings for Project ID and API Base URL
* Gutenberg block + shortcode support: `[bello_widget]`
* Optional global loading
* CDN-based script loading for fast updates

== Installation ==

1. In your WordPress admin, go to Plugins → Add New.
2. Search for "Bello Widget" (once published), or upload the plugin zip.
3. Activate the plugin.
4. Go to Settings → Bello Widget.
5. Add your Project ID and API Base URL.
6. Add the **Bello Widget** block or the `[bello_widget]` shortcode.

== Frequently Asked Questions ==

= How do I show the widget on every page? =

Enable **Load globally** in Settings → Bello Widget.

= Can I override settings per page? =

Yes. You can pass shortcode attributes like `project_id` and `api_base_url`.

== Screenshots ==

1. Bello Widget settings page.
2. Bello Widget block inspector.

== Changelog ==

= 0.3.0 =
* Add Gutenberg block support and admin validation notices.

== Upgrade Notice ==

= 0.3.0 =
Adds block support and admin validation notices.
