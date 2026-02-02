(function (wp) {
    if (!wp || !wp.blocks) {
        return;
    }

    var registerBlockType = wp.blocks.registerBlockType;
    var __ = wp.i18n.__;
    var InspectorControls = wp.blockEditor ? wp.blockEditor.InspectorControls : wp.editor.InspectorControls;
    var PanelBody = wp.components.PanelBody;
    var TextControl = wp.components.TextControl;
    var SelectControl = wp.components.SelectControl;
    var ToggleControl = wp.components.ToggleControl;
    var Notice = wp.components.Notice;

    var defaults = window.belloWidgetDefaults || {};
    var positions = defaults.positions || {
        'bottom-right': 'Bottom right',
        'bottom-left': 'Bottom left',
        'top-right': 'Top right',
        'top-left': 'Top left'
    };
    var themes = defaults.themes || {
        'dark': 'Dark',
        'light': 'Light',
        'glass': 'Glass'
    };
    var orbStyles = defaults.orbStyles || {
        'galaxy': 'Galaxy',
        'ocean-depths': 'Ocean Depths',
        'caribbean': 'Caribbean',
        'cherry-blossom': 'Cherry Blossom',
        'emerald': 'Emerald',
        'multi-color': 'Multi-color',
        'golden-glow': 'Golden Glow',
        'volcanic': 'Volcanic'
    };

    function optionList(obj) {
        return Object.keys(obj).map(function (key) {
            return { value: key, label: obj[key] };
        });
    }

    registerBlockType('bello/widget', {
        title: __('Bello Widget', 'bello-widget'),
        icon: 'format-audio',
        category: 'widgets',
        supports: {
            html: false
        },
        attributes: {
            projectId: { type: 'string' },
            apiBaseUrl: { type: 'string' },
            position: { type: 'string' },
            theme: { type: 'string' },
            orbStyle: { type: 'string' },
            agentEnabled: { type: 'boolean' },
            voiceEnabled: { type: 'boolean' }
        },
        edit: function (props) {
            var attrs = props.attributes;
            var setAttributes = props.setAttributes;

            var projectId = attrs.projectId || '';
            var apiBaseUrl = attrs.apiBaseUrl || '';
            var position = attrs.position || '';
            var theme = attrs.theme || '';
            var orbStyle = attrs.orbStyle || '';
            var agentEnabled = typeof attrs.agentEnabled === 'boolean' ? attrs.agentEnabled : undefined;
            var voiceEnabled = typeof attrs.voiceEnabled === 'boolean' ? attrs.voiceEnabled : undefined;

            var missingProjectId = !projectId && !defaults.projectId;
            var missingApiBaseUrl = !apiBaseUrl && !defaults.apiBaseUrl;

            return wp.element.createElement(
                wp.element.Fragment,
                null,
                wp.element.createElement(
                    InspectorControls,
                    null,
                    wp.element.createElement(
                        PanelBody,
                        { title: __('Bello Widget Settings', 'bello-widget'), initialOpen: true },
                        wp.element.createElement(TextControl, {
                            label: __('Project ID', 'bello-widget'),
                            value: projectId,
                            placeholder: defaults.projectId || '',
                            onChange: function (value) { setAttributes({ projectId: value }); }
                        }),
                        wp.element.createElement(TextControl, {
                            label: __('API Base URL', 'bello-widget'),
                            value: apiBaseUrl,
                            placeholder: defaults.apiBaseUrl || '',
                            onChange: function (value) { setAttributes({ apiBaseUrl: value }); }
                        }),
                        wp.element.createElement(SelectControl, {
                            label: __('Position', 'bello-widget'),
                            value: position,
                            options: [{ value: '', label: __('Use global setting', 'bello-widget') }].concat(optionList(positions)),
                            onChange: function (value) { setAttributes({ position: value }); }
                        }),
                        wp.element.createElement(SelectControl, {
                            label: __('Theme', 'bello-widget'),
                            value: theme,
                            options: [{ value: '', label: __('Use global setting', 'bello-widget') }].concat(optionList(themes)),
                            onChange: function (value) { setAttributes({ theme: value }); }
                        }),
                        wp.element.createElement(SelectControl, {
                            label: __('Orb Style', 'bello-widget'),
                            value: orbStyle,
                            options: [{ value: '', label: __('Use global setting', 'bello-widget') }].concat(optionList(orbStyles)),
                            onChange: function (value) { setAttributes({ orbStyle: value }); }
                        }),
                        wp.element.createElement(ToggleControl, {
                            label: __('Agent enabled', 'bello-widget'),
                            checked: agentEnabled !== undefined ? agentEnabled : defaults.agentEnabled !== false,
                            onChange: function (value) { setAttributes({ agentEnabled: value }); }
                        }),
                        wp.element.createElement(ToggleControl, {
                            label: __('Voice enabled', 'bello-widget'),
                            checked: voiceEnabled !== undefined ? voiceEnabled : defaults.voiceEnabled !== false,
                            onChange: function (value) { setAttributes({ voiceEnabled: value }); }
                        })
                    )
                ),
                wp.element.createElement(
                    'div',
                    { className: 'bello-widget-editor' },
                    wp.element.createElement('strong', null, __('Bello Widget', 'bello-widget')),
                    wp.element.createElement('p', null, __('The widget renders on the frontend. Configure global defaults in Settings → Bello Widget or override them here.', 'bello-widget')),
                    missingProjectId ? wp.element.createElement(Notice, { status: 'warning', isDismissible: false }, __('Project ID is missing. Add one in settings or here.', 'bello-widget')) : null,
                    missingApiBaseUrl ? wp.element.createElement(Notice, { status: 'warning', isDismissible: false }, __('API Base URL is missing. Add one in settings or here.', 'bello-widget')) : null
                )
            );
        },
        save: function () {
            return null;
        }
    });
})(window.wp);
