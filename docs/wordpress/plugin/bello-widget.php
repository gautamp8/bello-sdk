<?php
/**
 * Plugin Name: Bello Widget
 * Description: Embed the Bello voice widget via shortcode and settings.
 * Version: 0.3.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Bello
 * License: GPLv2 or later
 * Text Domain: bello-widget
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Bello_Widget_Plugin {
    const VERSION = '0.3.0';
    const HANDLE = 'bello-widget-sdk';
    const BLOCK_HANDLE = 'bello-widget-block';
    const OPTION_GROUP = 'bello_widget';
    const OPTION_PREFIX = 'bello_widget_';
    const CDN_URL = 'https://unpkg.com/@heybello/bello-sdk@latest/dist/bello-embed.iife.js';

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
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('wp_enqueue_scripts', array($this, 'maybe_enqueue_global'));
        add_shortcode('bello_widget', array($this, 'shortcode'));
        add_filter(
            'plugin_action_links_' . plugin_basename(__FILE__),
            array($this, 'settings_link')
        );
    }

    public function register_settings() {
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'project_id', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_project_id'),
            'default' => ''
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'api_base_url', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_api_base_url'),
            'default' => ''
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'position', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_position'),
            'default' => 'bottom-right'
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'theme', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_theme'),
            'default' => 'dark'
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'orb_style', array(
            'type' => 'string',
            'sanitize_callback' => array($this, 'sanitize_orb_style'),
            'default' => 'galaxy'
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'agent_enabled', array(
            'type' => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default' => true
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'voice_enabled', array(
            'type' => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default' => true
        ));
        register_setting(self::OPTION_GROUP, self::OPTION_PREFIX . 'load_globally', array(
            'type' => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
            'default' => false
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

    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = $this->get_settings();
        ?>
        <div class="wrap">
            <h1><?php echo esc_html__('Bello Widget', 'bello-widget'); ?></h1>
            <?php settings_errors(); ?>
            <form method="post" action="options.php">
                <?php settings_fields(self::OPTION_GROUP); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="bello_widget_project_id"><?php echo esc_html__('Project ID', 'bello-widget'); ?></label></th>
                        <td><input name="bello_widget_project_id" id="bello_widget_project_id" type="text" class="regular-text" value="<?php echo esc_attr($settings['project_id']); ?>" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="bello_widget_api_base_url"><?php echo esc_html__('API Base URL', 'bello-widget'); ?></label></th>
                        <td><input name="bello_widget_api_base_url" id="bello_widget_api_base_url" type="url" class="regular-text" value="<?php echo esc_attr($settings['api_base_url']); ?>" /></td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="bello_widget_position"><?php echo esc_html__('Position', 'bello-widget'); ?></label></th>
                        <td>
                            <select name="bello_widget_position" id="bello_widget_position">
                                <option value="bottom-right" <?php selected($settings['position'], 'bottom-right'); ?>><?php echo esc_html__('Bottom right', 'bello-widget'); ?></option>
                                <option value="bottom-left" <?php selected($settings['position'], 'bottom-left'); ?>><?php echo esc_html__('Bottom left', 'bello-widget'); ?></option>
                                <option value="top-right" <?php selected($settings['position'], 'top-right'); ?>><?php echo esc_html__('Top right', 'bello-widget'); ?></option>
                                <option value="top-left" <?php selected($settings['position'], 'top-left'); ?>><?php echo esc_html__('Top left', 'bello-widget'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="bello_widget_theme"><?php echo esc_html__('Theme', 'bello-widget'); ?></label></th>
                        <td>
                            <select name="bello_widget_theme" id="bello_widget_theme">
                                <option value="dark" <?php selected($settings['theme'], 'dark'); ?>><?php echo esc_html__('Dark', 'bello-widget'); ?></option>
                                <option value="light" <?php selected($settings['theme'], 'light'); ?>><?php echo esc_html__('Light', 'bello-widget'); ?></option>
                                <option value="glass" <?php selected($settings['theme'], 'glass'); ?>><?php echo esc_html__('Glass', 'bello-widget'); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="bello_widget_orb_style"><?php echo esc_html__('Orb style', 'bello-widget'); ?></label></th>
                        <td>
                            <select name="bello_widget_orb_style" id="bello_widget_orb_style">
                                <?php foreach ($this->orb_style_options() as $value => $label) : ?>
                                    <option value="<?php echo esc_attr($value); ?>" <?php selected($settings['orb_style'], $value); ?>><?php echo esc_html($label); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="bello_widget_agent_enabled"><?php echo esc_html__('Agent enabled', 'bello-widget'); ?></label></th>
                        <td>
                            <label>
                                <input name="bello_widget_agent_enabled" id="bello_widget_agent_enabled" type="checkbox" value="1" <?php checked($settings['agent_enabled'], true); ?> />
                                <?php echo esc_html__('Enable the agent experience', 'bello-widget'); ?>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="bello_widget_voice_enabled"><?php echo esc_html__('Voice enabled', 'bello-widget'); ?></label></th>
                        <td>
                            <label>
                                <input name="bello_widget_voice_enabled" id="bello_widget_voice_enabled" type="checkbox" value="1" <?php checked($settings['voice_enabled'], true); ?> />
                                <?php echo esc_html__('Enable voice interactions', 'bello-widget'); ?>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="bello_widget_load_globally"><?php echo esc_html__('Load globally', 'bello-widget'); ?></label></th>
                        <td>
                            <label>
                                <input name="bello_widget_load_globally" id="bello_widget_load_globally" type="checkbox" value="1" <?php checked($settings['load_globally'], true); ?> />
                                <?php echo esc_html__('Initialize the widget on every page', 'bello-widget'); ?>
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(__('Save Settings', 'bello-widget')); ?>
            </form>
            <p><?php echo esc_html__('Use the shortcode [bello_widget] to place the widget on a page or post.', 'bello-widget'); ?></p>
        </div>
        <?php
    }

    public function register_block() {
        if (!function_exists('register_block_type')) {
            return;
        }

        $script_url = plugins_url('blocks/bello-widget-block.js', __FILE__);
        wp_register_script(
            self::BLOCK_HANDLE,
            $script_url,
            array('wp-blocks', 'wp-element', 'wp-components', 'wp-i18n', 'wp-block-editor'),
            self::VERSION,
            true
        );

        $settings = $this->get_settings();
        wp_localize_script(self::BLOCK_HANDLE, 'belloWidgetDefaults', array(
            'projectId' => $settings['project_id'],
            'apiBaseUrl' => $settings['api_base_url'],
            'position' => $settings['position'],
            'theme' => $settings['theme'],
            'orbStyle' => $settings['orb_style'],
            'agentEnabled' => $settings['agent_enabled'],
            'voiceEnabled' => $settings['voice_enabled'],
            'positions' => array(
                'bottom-right' => 'Bottom right',
                'bottom-left' => 'Bottom left',
                'top-right' => 'Top right',
                'top-left' => 'Top left'
            ),
            'themes' => array(
                'dark' => 'Dark',
                'light' => 'Light',
                'glass' => 'Glass'
            ),
            'orbStyles' => $this->orb_style_options()
        ));

        register_block_type('bello/widget', array(
            'editor_script' => self::BLOCK_HANDLE,
            'render_callback' => array($this, 'render_block'),
            'attributes' => array(
                'projectId' => array('type' => 'string'),
                'apiBaseUrl' => array('type' => 'string'),
                'position' => array('type' => 'string'),
                'theme' => array('type' => 'string'),
                'orbStyle' => array('type' => 'string'),
                'agentEnabled' => array('type' => 'boolean'),
                'voiceEnabled' => array('type' => 'boolean')
            )
        ));
    }

    public function render_block($attributes) {
        $atts = array(
            'project_id' => isset($attributes['projectId']) ? $attributes['projectId'] : '',
            'api_base_url' => isset($attributes['apiBaseUrl']) ? $attributes['apiBaseUrl'] : '',
            'position' => isset($attributes['position']) ? $attributes['position'] : '',
            'theme' => isset($attributes['theme']) ? $attributes['theme'] : '',
            'orb_style' => isset($attributes['orbStyle']) ? $attributes['orbStyle'] : '',
            'agent_enabled' => isset($attributes['agentEnabled']) ? $attributes['agentEnabled'] : null,
            'voice_enabled' => isset($attributes['voiceEnabled']) ? $attributes['voiceEnabled'] : null
        );

        return $this->shortcode($atts);
    }

    public function shortcode($atts) {
        $defaults = $this->get_settings();

        $atts = shortcode_atts(array(
            'project_id' => $defaults['project_id'],
            'api_base_url' => $defaults['api_base_url'],
            'position' => $defaults['position'],
            'theme' => $defaults['theme'],
            'orb_style' => $defaults['orb_style'],
            'agent_enabled' => $defaults['agent_enabled'],
            'voice_enabled' => $defaults['voice_enabled']
        ), $atts, 'bello_widget');

        $args = $this->normalize_args($atts);

        if (empty($args['project_id'])) {
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

        if (empty($settings['project_id'])) {
            return;
        }

        $this->enqueue_and_init($settings);
    }

    private function enqueue_script() {
        if (!wp_script_is(self::HANDLE, 'enqueued')) {
            wp_enqueue_script(
                self::HANDLE,
                $this->get_cdn_url(),
                array(),
                self::VERSION,
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
    }

    private function enqueue_and_init($args) {
        $this->enqueue_script();

        $opts = array(
            'projectId' => $args['project_id']
        );

        if (!empty($args['api_base_url'])) {
            $opts['apiBaseUrl'] = $args['api_base_url'];
        }
        if (!empty($args['position'])) {
            $opts['position'] = $args['position'];
        }
        if (!empty($args['theme'])) {
            $opts['theme'] = $args['theme'];
        }
        if (!empty($args['orb_style'])) {
            $opts['orbStyle'] = $args['orb_style'];
        }
        if ($args['agent_enabled'] === false) {
            $opts['agentEnabled'] = false;
        }
        if ($args['voice_enabled'] === false) {
            $opts['voiceEnabled'] = false;
        }

        $opts = apply_filters('bello_widget_init_options', $opts, $args);

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
            'api_base_url' => get_option(self::OPTION_PREFIX . 'api_base_url', ''),
            'position' => $this->sanitize_position(get_option(self::OPTION_PREFIX . 'position', 'bottom-right')),
            'theme' => $this->sanitize_theme(get_option(self::OPTION_PREFIX . 'theme', 'dark')),
            'orb_style' => $this->sanitize_orb_style(get_option(self::OPTION_PREFIX . 'orb_style', 'galaxy')),
            'agent_enabled' => $this->to_bool(get_option(self::OPTION_PREFIX . 'agent_enabled', true)),
            'voice_enabled' => $this->to_bool(get_option(self::OPTION_PREFIX . 'voice_enabled', true)),
            'load_globally' => $this->to_bool(get_option(self::OPTION_PREFIX . 'load_globally', false))
        );
    }

    private function normalize_args($atts) {
        return array(
            'project_id' => sanitize_text_field($atts['project_id']),
            'api_base_url' => esc_url_raw($atts['api_base_url']),
            'position' => $this->sanitize_position($atts['position']),
            'theme' => $this->sanitize_theme($atts['theme']),
            'orb_style' => $this->sanitize_orb_style($atts['orb_style']),
            'agent_enabled' => $this->parse_bool($atts['agent_enabled']),
            'voice_enabled' => $this->parse_bool($atts['voice_enabled'])
        );
    }

    private function sanitize_position($value) {
        $allowed = array('bottom-right', 'bottom-left', 'top-right', 'top-left');
        return in_array($value, $allowed, true) ? $value : 'bottom-right';
    }

    private function sanitize_project_id($value) {
        $value = sanitize_text_field($value);
        if ($value === '') {
            add_settings_error(
                self::OPTION_GROUP,
                'bello_widget_project_id',
                __('Project ID is required to render the widget.', 'bello-widget'),
                'warning'
            );
        }
        return $value;
    }

    private function sanitize_api_base_url($value) {
        $value = esc_url_raw($value);
        if ($value === '') {
            add_settings_error(
                self::OPTION_GROUP,
                'bello_widget_api_base_url',
                __('API Base URL is recommended. Leave blank only if you use the default API.', 'bello-widget'),
                'warning'
            );
        }
        return $value;
    }

    private function sanitize_theme($value) {
        $allowed = array('dark', 'light', 'glass');
        return in_array($value, $allowed, true) ? $value : 'dark';
    }

    private function sanitize_orb_style($value) {
        $allowed = array_keys($this->orb_style_options());
        return in_array($value, $allowed, true) ? $value : 'galaxy';
    }

    private function orb_style_options() {
        return array(
            'galaxy' => 'Galaxy',
            'ocean-depths' => 'Ocean Depths',
            'caribbean' => 'Caribbean',
            'cherry-blossom' => 'Cherry Blossom',
            'emerald' => 'Emerald',
            'multi-color' => 'Multi-color',
            'golden-glow' => 'Golden Glow',
            'volcanic' => 'Volcanic'
        );
    }

    private function to_bool($value) {
        return $value ? true : false;
    }

    private function parse_bool($value) {
        if (is_bool($value)) {
            return $value;
        }
        if ($value === '' || $value === null) {
            return null;
        }
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private function get_cdn_url() {
        $url = apply_filters('bello_widget_cdn_url', self::CDN_URL);
        return esc_url_raw($url);
    }
}

Bello_Widget_Plugin::instance();
