(function (wp) {
    if (!wp || !wp.blocks) {
        return;
    }

    var registerBlockType = wp.blocks.registerBlockType;
    var __ = wp.i18n.__;
    var el = wp.element.createElement;
    var Fragment = wp.element.Fragment;
    var InspectorControls = wp.blockEditor ? wp.blockEditor.InspectorControls : wp.editor.InspectorControls;
    var PanelBody = wp.components.PanelBody;
    var TextControl = wp.components.TextControl;
    var SelectControl = wp.components.SelectControl;
    var Notice = wp.components.Notice;

    var defaults = window.zaidopBelloWidgetDefaults || {};
    var positions = defaults.positions || {
        'bottom-right': 'Bottom right',
        'bottom-left': 'Bottom left',
        'top-right': 'Top right',
        'top-left': 'Top left',
    };
    var themes = defaults.themes || {
        dark: 'Dark',
        light: 'Light',
    };

    function optionList(values) {
        return Object.keys(values).map(function (key) {
            return { value: key, label: values[key] };
        });
    }

    function resolveString(value, fallback) {
        return value !== undefined && value !== '' ? value : (fallback || '');
    }

    function resolveBoolean(value, fallback) {
        return typeof value === 'boolean' ? value : fallback;
    }

    function booleanSelectValue(value) {
        if (value === true) return 'true';
        if (value === false) return 'false';
        return '';
    }

    function setBooleanAttribute(setAttributes, key, value) {
        if (value === '') {
            setAttributes((function () {
                var next = {};
                next[key] = undefined;
                return next;
            })());
            return;
        }

        setAttributes((function () {
            var next = {};
            next[key] = value === 'true';
            return next;
        })());
    }

    registerBlockType('zaidop-bello-widget/widget', {
        title: __('Bello Widget', 'bello-widget'),
        icon: 'format-audio',
        category: 'widgets',
        supports: {
            html: false,
        },
        attributes: {
            projectId: { type: 'string' },
            widgetApiKey: { type: 'string' },
            apiBaseUrl: { type: 'string' },
            position: { type: 'string' },
            theme: { type: 'string' },
            accentColor: { type: 'string' },
            widgetTitle: { type: 'string' },
            widgetSubtitle: { type: 'string' },
            widgetButtonTitle: { type: 'string' },
            agentEnabled: { type: 'boolean' },
            voiceEnabled: { type: 'boolean' },
        },
        edit: function (props) {
            var attrs = props.attributes;
            var setAttributes = props.setAttributes;

            var effective = {
                projectId: resolveString(attrs.projectId, defaults.projectId),
                widgetApiKey: resolveString(attrs.widgetApiKey, defaults.widgetApiKey),
                apiBaseUrl: resolveString(attrs.apiBaseUrl, defaults.apiBaseUrl),
                position: resolveString(attrs.position, defaults.position || 'bottom-right'),
                theme: resolveString(attrs.theme, defaults.theme || 'dark'),
                accentColor: resolveString(attrs.accentColor, defaults.accentColor),
                widgetTitle: resolveString(attrs.widgetTitle, defaults.widgetTitle),
                widgetSubtitle: resolveString(attrs.widgetSubtitle, defaults.widgetSubtitle),
                widgetButtonTitle: resolveString(attrs.widgetButtonTitle, defaults.widgetButtonTitle),
                agentEnabled: resolveBoolean(attrs.agentEnabled, defaults.agentEnabled !== false),
                voiceEnabled: resolveBoolean(attrs.voiceEnabled, defaults.voiceEnabled !== false),
            };

            var notices = [];
            if (!effective.projectId) {
                notices.push(__('Project ID is missing. Set it globally or on this block.', 'bello-widget'));
            }
            if (!effective.widgetApiKey) {
                notices.push(__('Widget API Key is missing. Set it globally or on this block.', 'bello-widget'));
            }

            return el(
                Fragment,
                null,
                el(
                    InspectorControls,
                    null,
                    el(
                        PanelBody,
                        { title: __('Credentials', 'bello-widget'), initialOpen: true },
                        el(TextControl, {
                            label: __('Project ID', 'bello-widget'),
                            value: attrs.projectId || '',
                            placeholder: defaults.projectId || '',
                            onChange: function (value) { setAttributes({ projectId: value }); },
                        }),
                        el(TextControl, {
                            label: __('Widget API Key', 'bello-widget'),
                            value: attrs.widgetApiKey || '',
                            placeholder: defaults.widgetApiKey || '',
                            onChange: function (value) { setAttributes({ widgetApiKey: value }); },
                        }),
                        el(TextControl, {
                            label: __('API Base URL', 'bello-widget'),
                            value: attrs.apiBaseUrl || '',
                            placeholder: defaults.apiBaseUrl || '',
                            onChange: function (value) { setAttributes({ apiBaseUrl: value }); },
                        })
                    ),
                    el(
                        PanelBody,
                        { title: __('Appearance', 'bello-widget'), initialOpen: false },
                        el(SelectControl, {
                            label: __('Position', 'bello-widget'),
                            value: attrs.position || '',
                            options: [{ value: '', label: __('Use global setting', 'bello-widget') }].concat(optionList(positions)),
                            onChange: function (value) { setAttributes({ position: value }); },
                        }),
                        el(SelectControl, {
                            label: __('Theme', 'bello-widget'),
                            value: attrs.theme || '',
                            options: [{ value: '', label: __('Use global setting', 'bello-widget') }].concat(optionList(themes)),
                            onChange: function (value) { setAttributes({ theme: value }); },
                        }),
                        el(TextControl, {
                            label: __('Accent color', 'bello-widget'),
                            value: attrs.accentColor || '',
                            placeholder: defaults.accentColor || '#1FD5F9',
                            onChange: function (value) { setAttributes({ accentColor: value }); },
                        }),
                        el(TextControl, {
                            label: __('Widget title', 'bello-widget'),
                            value: attrs.widgetTitle || '',
                            placeholder: defaults.widgetTitle || '',
                            onChange: function (value) { setAttributes({ widgetTitle: value }); },
                        }),
                        el(TextControl, {
                            label: __('Widget subtitle', 'bello-widget'),
                            value: attrs.widgetSubtitle || '',
                            placeholder: defaults.widgetSubtitle || '',
                            onChange: function (value) { setAttributes({ widgetSubtitle: value }); },
                        }),
                        el(TextControl, {
                            label: __('Launcher button title', 'bello-widget'),
                            value: attrs.widgetButtonTitle || '',
                            placeholder: defaults.widgetButtonTitle || '',
                            onChange: function (value) { setAttributes({ widgetButtonTitle: value }); },
                        })
                    ),
                    el(
                        PanelBody,
                        { title: __('Behavior', 'bello-widget'), initialOpen: false },
                        el(SelectControl, {
                            label: __('Agent enabled', 'bello-widget'),
                            value: booleanSelectValue(attrs.agentEnabled),
                            options: [
                                { value: '', label: __('Use global setting', 'bello-widget') },
                                { value: 'true', label: __('Enabled', 'bello-widget') },
                                { value: 'false', label: __('Disabled', 'bello-widget') },
                            ],
                            onChange: function (value) { setBooleanAttribute(setAttributes, 'agentEnabled', value); },
                        }),
                        el(SelectControl, {
                            label: __('Voice enabled', 'bello-widget'),
                            value: booleanSelectValue(attrs.voiceEnabled),
                            options: [
                                { value: '', label: __('Use global setting', 'bello-widget') },
                                { value: 'true', label: __('Enabled', 'bello-widget') },
                                { value: 'false', label: __('Disabled', 'bello-widget') },
                            ],
                            onChange: function (value) { setBooleanAttribute(setAttributes, 'voiceEnabled', value); },
                        })
                    )
                ),
                el(
                    'div',
                    {
                        className: 'bello-widget-editor',
                        style: {
                            border: '1px solid #dcdcde',
                            borderRadius: '12px',
                            padding: '16px',
                            background: '#fff',
                        },
                    },
                    el('strong', null, __('Bello Widget', 'bello-widget')),
                    el(
                        'p',
                        { style: { marginTop: '8px', marginBottom: '12px', color: '#50575e' } },
                        __('The real widget is fixed-position and loads only on the frontend. This block previews the resolved settings only.', 'bello-widget')
                    ),
                    notices.map(function (message, index) {
                        return el(Notice, { key: index, status: 'warning', isDismissible: false }, message);
                    }),
                    el(
                        'dl',
                        {
                            style: {
                                display: 'grid',
                                gridTemplateColumns: 'max-content 1fr',
                                gap: '8px 12px',
                                margin: 0,
                            },
                        },
                        el('dt', null, __('Project ID', 'bello-widget')),
                        el('dd', { style: { margin: 0 } }, effective.projectId || __('Using global setting', 'bello-widget')),
                        el('dt', null, __('Widget API Key', 'bello-widget')),
                        el('dd', { style: { margin: 0 } }, effective.widgetApiKey ? __('Configured', 'bello-widget') : __('Using global setting', 'bello-widget')),
                        el('dt', null, __('Theme', 'bello-widget')),
                        el('dd', { style: { margin: 0 } }, effective.theme),
                        el('dt', null, __('Position', 'bello-widget')),
                        el('dd', { style: { margin: 0 } }, effective.position),
                        el('dt', null, __('Accent color', 'bello-widget')),
                        el('dd', { style: { margin: 0 } }, effective.accentColor || __('Dashboard default', 'bello-widget')),
                        el('dt', null, __('Agent', 'bello-widget')),
                        el('dd', { style: { margin: 0 } }, effective.agentEnabled ? __('Enabled', 'bello-widget') : __('Disabled', 'bello-widget')),
                        el('dt', null, __('Voice', 'bello-widget')),
                        el('dd', { style: { margin: 0 } }, effective.voiceEnabled ? __('Enabled', 'bello-widget') : __('Disabled', 'bello-widget'))
                    )
                )
            );
        },
        save: function () {
            return null;
        },
    });
})(window.wp);
