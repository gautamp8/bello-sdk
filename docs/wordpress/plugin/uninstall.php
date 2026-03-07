<?php

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$bello_widget_keys = array(
    'project_id',
    'widget_api_key',
    'api_base_url',
    'position',
    'theme',
    'accent_color',
    'widget_title',
    'widget_subtitle',
    'widget_button_title',
    'agent_enabled',
    'voice_enabled',
    'load_globally',
    'orb_style',
);

foreach ($bello_widget_keys as $bello_widget_key) {
    delete_option('bello_widget_' . $bello_widget_key);
    if (is_multisite()) {
        delete_site_option('bello_widget_' . $bello_widget_key);
    }
}
