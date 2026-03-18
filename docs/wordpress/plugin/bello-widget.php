<?php
/**
 * Plugin Name: Bello Widget
 * Description: Embed the Bello voice widget via shortcode, block, or global settings.
 * Version: 0.4.4
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Bello
 * License: GPLv2 or later
 * Text Domain: bello-widget
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Zaidop_Bello_Widget_Plugin {
    const VERSION = '0.4.4';
    const HANDLE = 'zaidop-bello-widget-sdk';
    const BLOCK_HANDLE = 'zaidop-bello-widget-block';
    const OPTION_GROUP = 'zaidop_bello_widget';
    const OPTION_PREFIX = 'zaidop_bello_widget_';
    const SHORTCODE = 'zaidop_bello_widget';
    const BLOCK_NAME = 'zaidop-bello-widget/widget';
    const JS_DEFAULTS_OBJECT = 'zaidopBelloWidgetDefaults';
    const SCRIPT_RELATIVE_PATH = 'assets/sdk/bello-embed.iife.js';

    private static $instance = null;
    private $init_added = false;
    private $last_init_signature = null;

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    private function __construct() {
        add_action('init', array($this, 'register_block'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_init', array($this, 'add_privacy_policy_content'));
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_notices', array($this, 'render_admin_notices'));
        add_action('wp_enqueue_scripts', array($this, 'maybe_enqueue_global'));
        add_shortcode(self::SHORTCODE, array($this, 'shortcode'));
        add_filter(
            'plugin_action_links_' . plugin_basename(__FILE__),
            array($this, 'settings_link')
        );
    }

    public function register_settings() {
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'project_id', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_project_id'),
            'default' => '',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'widget_api_key', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_widget_api_key'),
            'default' => '',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'api_base_url', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_api_base_url'),
            'default' => '',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'position', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_position'),
            'default' => 'bottom-right',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'theme', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_theme'),
            'default' => 'dark',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'accent_color', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_accent_color'),
            'default' => '',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'widget_title', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_widget_copy'),
            'default' => '',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'widget_subtitle', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_widget_copy'),
            'default' => '',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'widget_button_title', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_widget_copy'),
            'default' => '',
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'agent_enabled', array(
            'type' => 'boolean',
            'sanitize_callback' => array($this, 'sanitize_boolean_flag'),
            'default' => true,
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'voice_enabled', array(
            'type' => 'boolean',
            'sanitize_callback' => array($this, 'sanitize_boolean_flag'),
            'default' => true,
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'load_globally', array(
            'type' => 'boolean',
            'sanitize_callback' => array($this, 'sanitize_boolean_flag'),
            'default' => false,
        ));
    }

    public function add_settings_page() {
        add_options_page(
            __('Bello Widget', 'bello-widget'),
            __('Bello Widget', 'bello-widget'),
            'manage_options',
            'bello-widget',
            array($this, 'render_settings_page')
        );
    }

    public function settings_link($links) {
        $url = admin_url('options-general.php?page=bello-widget');
        $links[] = '<a href="' . esc_url($url) . '">' . esc_html__('Settings', 'bello-widget') . '</a>';
        return $links;
    }

    public function add_privacy_policy_content() {
        if (!function_exists('wp_add_privacy_policy_content')) {
            return;
        }

        $content = '<p class="privacy-policy-tutorial">'
            . esc_html__('Suggested text that site owners can include in their privacy policy.', 'bello-widget')
            . '</p>';
        $content .= '<strong class="privacy-policy-tutorial">'
            . esc_html__('Suggested text:', 'bello-widget')
            . '</strong> ';
        $content .= sprintf(
            __(
                'If you use Bello Widget on your site, pages that load the widget send technical data such as the visitor\'s IP address, browser information, and page URL to Bello so the widget can load and function. When a visitor starts a live session, the browser also connects to Bello to request session credentials and may send session metadata, audio input, and a generated session ID so the realtime session can be created and ended correctly. Bello may also return a realtime media server URL that the visitor\'s browser connects to directly during the live session. You can learn more in Bello\'s <a href="%1$s" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="%2$s" target="_blank" rel="noopener noreferrer">Terms of Service</a>.',
                'bello-widget'
            ),
            esc_url('https://www.heybello.dev/privacy'),
            esc_url('https://www.heybello.dev/terms')
        );

        wp_add_privacy_policy_content(
            __('Bello Widget', 'bello-widget'),
            wp_kses_post(wpautop($content, false))
        );
    }

    public function render_admin_notices() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = $this->get_settings();
        $messages = array();

        if (empty($settings['project_id'])) {
            $messages[] = __('Bello Widget needs a Project ID before it can initialize on the frontend.', 'bello-widget');
        }

        if (empty($settings['widget_api_key'])) {
            $messages[] = __('Bello Widget needs a Widget API Key before it can initialize on the frontend.', 'bello-widget');
        }

        if (!file_exists($this->get_local_script_path())) {
            $messages[] = __('The bundled SDK asset is missing. Run `pnpm wordpress:build` before local testing or packaging the plugin.', 'bello-widget');
        }

        if (empty($messages)) {
            return;
        }

        $settings_url = admin_url('options-general.php?page=bello-widget');
        echo '<div class="notice notice-warning"><p>';
        echo esc_html(implode(' ', $messages)) . ' ';
        echo '<a href="' . esc_url($settings_url) . '">' . esc_html__('Open Bello Widget settings.', 'bello-widget') . '</a>';
        echo '</p></div>';
    }

    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = $this->get_settings();
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('Bello Widget', 'bello-widget'); ?></h1>
            <p><?php echo esc_html__('Use the same widget runtime as the Bello service embed, then place it with a shortcode, block, or global loading.', 'bello-widget'); ?></p>
            <?php settings_errors(); ?>
            <form method="post" action="options.php">
                <?php settings_fields(self::OPTION_GROUP); ?>

                <h2><?php echo esc_html__('Credentials', 'bello-widget'); ?></h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_project_id"><?php echo esc_html__('Project ID', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <input name="zaidop_bello_widget_project_id" id="zaidop_bello_widget_project_id" type="text" class="regular-text" value="<?php echo esc_attr($settings['project_id']); ?>" />
                            <p class="description"><?php echo esc_html__('Required. Found in the Bello Deploy screen.', 'bello-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_widget_api_key"><?php echo esc_html__('Widget API Key', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <input name="zaidop_bello_widget_widget_api_key" id="zaidop_bello_widget_widget_api_key" type="text" class="regular-text" value="<?php echo esc_attr($settings['widget_api_key']); ?>" />
                            <p class="description"><?php echo esc_html__('Required. This powers config fetches and LiveKit token creation.', 'bello-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_api_base_url"><?php echo esc_html__('API Base URL', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <input name="zaidop_bello_widget_api_base_url" id="zaidop_bello_widget_api_base_url" type="url" class="regular-text" value="<?php echo esc_attr($settings['api_base_url']); ?>" />
                            <p class="description"><?php echo esc_html__('Optional. Leave blank to use the default Bello API.', 'bello-widget'); ?></p>
                        </td>
                    </tr>
                </table>

                <h2><?php echo esc_html__('Appearance', 'bello-widget'); ?></h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_position"><?php echo esc_html__('Position', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <select name="zaidop_bello_widget_position" id="zaidop_bello_widget_position">
                                <option value="bottom-right" <?php selected($settings['position'], 'bottom-right'); ?>><?php echo esc_html__('Bottom right', 'bello-widget'); ?></option>
                                <option value="bottom-left" <?php selected($settings['position'], 'bottom-left'); ?>><?php echo esc_html__('Bottom left', 'bello-widget'); ?></option>
                                <option value="top-right" <?php selected($settings['position'], 'top-right'); ?>><?php echo esc_html__('Top right', 'bello-widget'); ?></option>
                                <option value="top-left" <?php selected($settings['position'], 'top-left'); ?>><?php echo esc_html__('Top left', 'bello-widget'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_theme"><?php echo esc_html__('Theme', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <select name="zaidop_bello_widget_theme" id="zaidop_bello_widget_theme">
                                <option value="dark" <?php selected($settings['theme'], 'dark'); ?>><?php echo esc_html__('Dark', 'bello-widget'); ?></option>
                                <option value="light" <?php selected($settings['theme'], 'light'); ?>><?php echo esc_html__('Light', 'bello-widget'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_accent_color"><?php echo esc_html__('Accent color', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <input name="zaidop_bello_widget_accent_color" id="zaidop_bello_widget_accent_color" type="text" class="regular-text" placeholder="#1FD5F9" value="<?php echo esc_attr($settings['accent_color']); ?>" />
                            <p class="description"><?php echo esc_html__('Optional. Matches the SDK accentColor override.', 'bello-widget'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_widget_title"><?php echo esc_html__('Widget title', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <input name="zaidop_bello_widget_widget_title" id="zaidop_bello_widget_widget_title" type="text" class="regular-text" value="<?php echo esc_attr($settings['widget_title']); ?>" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_widget_subtitle"><?php echo esc_html__('Widget subtitle', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <input name="zaidop_bello_widget_widget_subtitle" id="zaidop_bello_widget_widget_subtitle" type="text" class="regular-text" value="<?php echo esc_attr($settings['widget_subtitle']); ?>" />
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="zaidop_bello_widget_widget_button_title"><?php echo esc_html__('Launcher button title', 'bello-widget'); ?></label>
                        </th>
                        <td>
                            <input name="zaidop_bello_widget_widget_button_title" id="zaidop_bello_widget_widget_button_title" type="text" class="regular-text" value="<?php echo esc_attr($settings['widget_button_title']); ?>" />
                        </td>
                    </tr>
                </table>

                <h2><?php echo esc_html__('Behavior', 'bello-widget'); ?></h2>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><?php echo esc_html__('Agent enabled', 'bello-widget'); ?></th>
                        <td>
                            <input type="hidden" name="zaidop_bello_widget_agent_enabled" value="0" />
                            <label for="zaidop_bello_widget_agent_enabled">
                                <input name="zaidop_bello_widget_agent_enabled" id="zaidop_bello_widget_agent_enabled" type="checkbox" value="1" <?php checked($settings['agent_enabled'], true); ?> />
                                <?php echo esc_html__('Enable the live agent experience.', 'bello-widget'); ?>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php echo esc_html__('Voice enabled', 'bello-widget'); ?></th>
                        <td>
                            <input type="hidden" name="zaidop_bello_widget_voice_enabled" value="0" />
                            <label for="zaidop_bello_widget_voice_enabled">
                                <input name="zaidop_bello_widget_voice_enabled" id="zaidop_bello_widget_voice_enabled" type="checkbox" value="1" <?php checked($settings['voice_enabled'], true); ?> />
                                <?php echo esc_html__('Enable voice playback and visualizers.', 'bello-widget'); ?>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php echo esc_html__('Load globally', 'bello-widget'); ?></th>
                        <td>
                            <input type="hidden" name="zaidop_bello_widget_load_globally" value="0" />
                            <label for="zaidop_bello_widget_load_globally">
                                <input name="zaidop_bello_widget_load_globally" id="zaidop_bello_widget_load_globally" type="checkbox" value="1" <?php checked($settings['load_globally'], true); ?> />
                                <?php echo esc_html__('Initialize the widget on every frontend page.', 'bello-widget'); ?>
                            </label>
                            <p class="description"><?php echo esc_html__('Block or shortcode overrides rendered later on the page will still win.', 'bello-widget'); ?></p>
                        </td>
                    </tr>
                </table>

                <?php submit_button(__('Save Settings', 'bello-widget')); ?>
            </form>

            <hr />
            <h2><?php echo esc_html__('Usage', 'bello-widget'); ?></h2>
            <p><?php echo esc_html__('Shortcode:', 'bello-widget'); ?> <code>[zaidop_bello_widget]</code></p>
            <p><?php echo esc_html__('Per-page overrides use the same keys as the SDK, converted to shortcode attributes.', 'bello-widget'); ?></p>
            <p><code>[zaidop_bello_widget theme="light" position="bottom-left" accent_color="#FF6B2C"]</code></p>
        </div>
        <?php
    }

    public function register_block() {
        if (!function_exists('register_block_type')) {
            return;
        }

        wp_register_script(
            self::BLOCK_HANDLE,
            plugins_url('blocks/bello-widget-block.js', __FILE__),
            array('wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n'),
            self::VERSION,
            true
        );

        $settings = $this->get_settings();
        wp_localize_script(self::BLOCK_HANDLE, self::JS_DEFAULTS_OBJECT, array(
            'projectId' => $settings['project_id'],
            'widgetApiKey' => $settings['widget_api_key'],
            'apiBaseUrl' => $settings['api_base_url'],
            'position' => $settings['position'],
            'theme' => $settings['theme'],
            'accentColor' => $settings['accent_color'],
            'widgetTitle' => $settings['widget_title'],
            'widgetSubtitle' => $settings['widget_subtitle'],
            'widgetButtonTitle' => $settings['widget_button_title'],
            'agentEnabled' => $settings['agent_enabled'],
            'voiceEnabled' => $settings['voice_enabled'],
            'positions' => array(
                'bottom-right' => __('Bottom right', 'bello-widget'),
                'bottom-left' => __('Bottom left', 'bello-widget'),
                'top-right' => __('Top right', 'bello-widget'),
                'top-left' => __('Top left', 'bello-widget'),
            ),
            'themes' => array(
                'dark' => __('Dark', 'bello-widget'),
                'light' => __('Light', 'bello-widget'),
            ),
        ));

        register_block_type(self::BLOCK_NAME, array(
            'editor_script' => self::BLOCK_HANDLE,
            'render_callback' => array($this, 'render_block'),
            'attributes' => array(
                'projectId' => array('type' => 'string'),
                'widgetApiKey' => array('type' => 'string'),
                'apiBaseUrl' => array('type' => 'string'),
                'position' => array('type' => 'string'),
                'theme' => array('type' => 'string'),
                'accentColor' => array('type' => 'string'),
                'widgetTitle' => array('type' => 'string'),
                'widgetSubtitle' => array('type' => 'string'),
                'widgetButtonTitle' => array('type' => 'string'),
                'agentEnabled' => array('type' => 'boolean'),
                'voiceEnabled' => array('type' => 'boolean'),
            ),
        ));
    }

    public function render_block($attributes) {
        $atts = array();

        $string_map = array(
            'projectId' => 'project_id',
            'widgetApiKey' => 'widget_api_key',
            'apiBaseUrl' => 'api_base_url',
            'position' => 'position',
            'theme' => 'theme',
            'accentColor' => 'accent_color',
            'widgetTitle' => 'widget_title',
            'widgetSubtitle' => 'widget_subtitle',
            'widgetButtonTitle' => 'widget_button_title',
        );

        foreach ($string_map as $source => $target) {
            if (isset($attributes[$source]) && $attributes[$source] !== '') {
                $atts[$target] = $attributes[$source];
            }
        }

        if (array_key_exists('agentEnabled', $attributes)) {
            $atts['agent_enabled'] = $attributes['agentEnabled'];
        }

        if (array_key_exists('voiceEnabled', $attributes)) {
            $atts['voice_enabled'] = $attributes['voiceEnabled'];
        }

        return $this->shortcode($atts);
    }

    public function shortcode($atts) {
        $defaults = $this->get_settings();

        $atts = shortcode_atts(array(
            'project_id' => $defaults['project_id'],
            'widget_api_key' => $defaults['widget_api_key'],
            'api_base_url' => $defaults['api_base_url'],
            'position' => $defaults['position'],
            'theme' => $defaults['theme'],
            'accent_color' => $defaults['accent_color'],
            'widget_title' => $defaults['widget_title'],
            'widget_subtitle' => $defaults['widget_subtitle'],
            'widget_button_title' => $defaults['widget_button_title'],
            'agent_enabled' => $defaults['agent_enabled'],
            'voice_enabled' => $defaults['voice_enabled'],
        ), $atts, self::SHORTCODE);

        $args = $this->normalize_args($atts);

        if (!$this->has_required_credentials($args)) {
            return '';
        }

        $this->enqueue_and_init($args);

        return '<div class="bello-widget-placeholder" aria-hidden="true"></div>';
    }

    public function maybe_enqueue_global() {
        $settings = $this->get_settings();

        if (!$settings['load_globally']) {
            return;
        }

        if (!$this->has_required_credentials($settings)) {
            return;
        }

        $this->enqueue_and_init($settings);
    }

    private function enqueue_script() {
        if (wp_script_is(self::HANDLE, 'enqueued')) {
            return;
        }

        wp_enqueue_script(
            self::HANDLE,
            $this->get_local_script_url(),
            array(),
            $this->get_script_version(),
            true
        );

        if (function_exists('wp_script_add_data')) {
            if (function_exists('wp_get_script_tag')) {
                wp_script_add_data(self::HANDLE, 'strategy', 'defer');
            } else {
                wp_script_add_data(self::HANDLE, 'defer', true);
            }
        }
    }

    private function enqueue_and_init($args) {
        $this->enqueue_script();

        $opts = array(
            'projectId' => $args['project_id'],
            'widgetApiKey' => $args['widget_api_key'],
        );

        if ($args['api_base_url'] !== '') {
            $opts['apiBaseUrl'] = $args['api_base_url'];
        }
        if ($args['position'] !== '') {
            $opts['position'] = $args['position'];
        }
        if ($args['theme'] !== '') {
            $opts['theme'] = $args['theme'];
        }
        if ($args['accent_color'] !== '') {
            $opts['accentColor'] = $args['accent_color'];
        }
        if ($args['widget_title'] !== '') {
            $opts['widgetTitle'] = $args['widget_title'];
        }
        if ($args['widget_subtitle'] !== '') {
            $opts['widgetSubtitle'] = $args['widget_subtitle'];
        }
        if ($args['widget_button_title'] !== '') {
            $opts['widgetButtonTitle'] = $args['widget_button_title'];
        }
        if ($args['agent_enabled'] !== null) {
            $opts['agentEnabled'] = (bool) $args['agent_enabled'];
        }
        if ($args['voice_enabled'] !== null) {
            $opts['voiceEnabled'] = (bool) $args['voice_enabled'];
        }

        $opts = apply_filters('zaidop_bello_widget_init_options', $opts, $args);

        $json = wp_json_encode($opts, JSON_UNESCAPED_SLASHES);
        $signature = md5($json);

        if (!$this->init_added) {
            $script = 'window.Bello=window.Bello||[];window.Bello.push(["init",' . $json . ']);';
            wp_add_inline_script(self::HANDLE, $script, 'after');
            $this->init_added = true;
            $this->last_init_signature = $signature;
            return;
        }

        if ($this->last_init_signature !== $signature) {
            $script = 'window.Bello=window.Bello||[];window.Bello.push(["update",' . $json . ']);';
            wp_add_inline_script(self::HANDLE, $script, 'after');
            $this->last_init_signature = $signature;
        }
    }

    private function get_settings() {
        return array(
            'project_id' => get_option(self::OPTION_PREFIX . 'project_id', ''),
            'widget_api_key' => get_option(self::OPTION_PREFIX . 'widget_api_key', ''),
            'api_base_url' => get_option(self::OPTION_PREFIX . 'api_base_url', ''),
            'position' => $this->sanitize_position(get_option(self::OPTION_PREFIX . 'position', 'bottom-right')),
            'theme' => $this->sanitize_theme(get_option(self::OPTION_PREFIX . 'theme', 'dark')),
            'accent_color' => $this->sanitize_accent_color(get_option(self::OPTION_PREFIX . 'accent_color', '')),
            'widget_title' => $this->sanitize_widget_copy(get_option(self::OPTION_PREFIX . 'widget_title', '')),
            'widget_subtitle' => $this->sanitize_widget_copy(get_option(self::OPTION_PREFIX . 'widget_subtitle', '')),
            'widget_button_title' => $this->sanitize_widget_copy(get_option(self::OPTION_PREFIX . 'widget_button_title', '')),
            'agent_enabled' => $this->to_bool(get_option(self::OPTION_PREFIX . 'agent_enabled', true)),
            'voice_enabled' => $this->to_bool(get_option(self::OPTION_PREFIX . 'voice_enabled', true)),
            'load_globally' => $this->to_bool(get_option(self::OPTION_PREFIX . 'load_globally', false)),
        );
    }

    private function normalize_args($atts) {
        return array(
            'project_id' => $this->sanitize_project_id($atts['project_id']),
            'widget_api_key' => $this->sanitize_widget_api_key($atts['widget_api_key']),
            'api_base_url' => $this->sanitize_api_base_url($atts['api_base_url']),
            'position' => $atts['position'] === '' ? '' : $this->sanitize_position($atts['position']),
            'theme' => $atts['theme'] === '' ? '' : $this->sanitize_theme($atts['theme']),
            'accent_color' => $this->sanitize_accent_color($atts['accent_color']),
            'widget_title' => $this->sanitize_widget_copy($atts['widget_title']),
            'widget_subtitle' => $this->sanitize_widget_copy($atts['widget_subtitle']),
            'widget_button_title' => $this->sanitize_widget_copy($atts['widget_button_title']),
            'agent_enabled' => $this->parse_bool($atts['agent_enabled']),
            'voice_enabled' => $this->parse_bool($atts['voice_enabled']),
        );
    }

    private function has_required_credentials($args) {
        return !empty($args['project_id']) && !empty($args['widget_api_key']);
    }

    public function sanitize_project_id($value) {
        return sanitize_text_field((string) $value);
    }

    public function sanitize_widget_api_key($value) {
        return sanitize_text_field((string) $value);
    }

    public function sanitize_api_base_url($value) {
        $value = trim((string) $value);
        if ($value === '') {
            return '';
        }

        return esc_url_raw($value);
    }

    public function sanitize_position($value) {
        $allowed = array('bottom-right', 'bottom-left', 'top-right', 'top-left');
        return in_array($value, $allowed, true) ? $value : 'bottom-right';
    }

    public function sanitize_theme($value) {
        $allowed = array('dark', 'light');
        return in_array($value, $allowed, true) ? $value : 'dark';
    }

    public function sanitize_accent_color($value) {
        $value = trim((string) $value);

        if ($value === '') {
            return '';
        }

        $sanitized = sanitize_hex_color($value);

        return is_string($sanitized) ? $sanitized : '';
    }

    public function sanitize_widget_copy($value) {
        return sanitize_text_field((string) $value);
    }

    public function sanitize_boolean_flag($value) {
        return rest_sanitize_boolean($value);
    }

    private function to_bool($value) {
        return rest_sanitize_boolean($value);
    }

    private function parse_bool($value) {
        if ($value === '' || $value === null) {
            return null;
        }

        if (is_bool($value)) {
            return $value;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private function get_local_script_path() {
        return plugin_dir_path(__FILE__) . self::SCRIPT_RELATIVE_PATH;
    }

    private function get_local_script_url() {
        return plugins_url(self::SCRIPT_RELATIVE_PATH, __FILE__);
    }

    private function get_script_version() {
        $path = $this->get_local_script_path();

        if (file_exists($path)) {
            return (string) filemtime($path);
        }

        return self::VERSION;
    }
}

Zaidop_Bello_Widget_Plugin::instance();
