<?php

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$zaidop_bello_widget_keys = array(
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
);

foreach ($zaidop_bello_widget_keys as $zaidop_bello_widget_key) {
    delete_option('zaidop_bello_widget_' . $zaidop_bello_widget_key);
    if (is_multisite()) {
        delete_site_option('zaidop_bello_widget_' . $zaidop_bello_widget_key);
    }
}
