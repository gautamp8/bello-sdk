<?php

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

$bello_widget_keys = array(
    'project_id',
    'api_base_url',
    'position',
    'theme',
    'orb_style',
    'agent_enabled',
    'voice_enabled',
    'load_globally'
);

foreach ($bello_widget_keys as $bello_widget_key) {
    delete_option('bello_widget_' . $bello_widget_key);
    if (is_multisite()) {
        delete_site_option('bello_widget_' . $bello_widget_key);
    }
}
